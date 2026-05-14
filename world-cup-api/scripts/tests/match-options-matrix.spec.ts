import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { MatchContextBuilderHelper } from '../../src/match/helper/match-context-builder.helper';
import { MatchTurnOptionsHelper } from '../../src/match/helper/match-turn-options.helper';
import { MatchRuntimeConfigHelper } from '../../src/match/helper/match-runtime-config.helper';

type MatchOptionLike = { index: number; action: MatchAction };

const DEFENSIVE_ACTION_SET = new Set<MatchAction>([
  MatchAction.PRESS,
  MatchAction.DEFEND,
  MatchAction.TACKLE,
  MatchAction.BLOCK,
]);

const GOALKEEPER_ACTION_SET = new Set<MatchAction>([
  MatchAction.DIVE_LEFT,
  MatchAction.DIVE_RIGHT,
  MatchAction.STAY_CENTER,
  MatchAction.WAIT,
]);

function createMatchServiceHarness(): any {
  const contextBuilder = new MatchContextBuilderHelper({
    areTeamsRivals: async () => false,
  } as any);
  const i18nService = { t: (_key: string, _lang: string) => '' };
  const configService = { get: () => undefined };
  const runtimeConfigHelper = new MatchRuntimeConfigHelper(configService as any);
  const optionsHelper = new MatchTurnOptionsHelper(
    contextBuilder,
    i18nService as any,
    configService as any,
  );
  return {
    actionsByEvent: runtimeConfigHelper.loadActionsByEvent(),
    contextBuilder,
    optionsHelper,
  };
}

function toSet(actions: MatchAction[]): Set<MatchAction> {
  return new Set(actions);
}

function assertSameActionSet(actual: MatchAction[], expected: MatchAction[], context: string): void {
  assert.deepEqual(toSet(actual), toSet(expected), context);
}

function assertOnlyDefensive(actions: MatchAction[], context: string): void {
  for (const action of actions) {
    assert(
      DEFENSIVE_ACTION_SET.has(action),
      `${context}: expected only defensive actions, got ${action}`,
    );
  }
}

function assertOnlyGoalkeeper(actions: MatchAction[], context: string): void {
  for (const action of actions) {
    assert(
      GOALKEEPER_ACTION_SET.has(action),
      `${context}: expected only goalkeeper actions, got ${action}`,
    );
  }
}

function extractTurnActions(options: MatchOptionLike[]): MatchAction[] {
  return options.slice(0, 3).map((option) => option.action);
}

function buildOptions(
  service: any,
  eventType: MatchEventType,
  possession: MatchPossession = MatchPossession.USER,
  zone: MatchFieldZone = MatchFieldZone.MIDFIELD,
): MatchOptionLike[] {
  return service.optionsHelper.buildOptions({
    eventType,
    language: 'es',
    possession,
    zone,
    actionsByEvent: service.actionsByEvent,
  }) as MatchOptionLike[];
}

function resolvePool(
  service: any,
  eventType: MatchEventType,
  possession: MatchPossession,
  zone: MatchFieldZone,
): MatchAction[] {
  return service.contextBuilder.getAvailableActions(
    eventType,
    zone,
    possession,
    service.actionsByEvent,
  ) as MatchAction[];
}

function run(): void {
  const service = createMatchServiceHarness();
  const covered = new Set<MatchEventType>();

  // HALF_TIME_EVENT
  covered.add(MatchEventType.HALF_TIME_EVENT);
  const halfTimeOptions = buildOptions(service, MatchEventType.HALF_TIME_EVENT);
  assert.equal(halfTimeOptions.length, 2, 'HALF_TIME_EVENT should return exactly 2 options');
  assert.equal(halfTimeOptions[0].action, MatchAction.RESTART_MATCH);
  assert.equal(halfTimeOptions[1].action, MatchAction.QUIT_MATCH);

  // BALL_POSSESSION_EVENT (reference pools and zone priorities).
  const userDefenseThirdPool = resolvePool(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.DEFENSE_THIRD,
  );
  assert(userDefenseThirdPool.includes(MatchAction.PASS));
  assert(userDefenseThirdPool.includes(MatchAction.LONG_PASS));
  assert(userDefenseThirdPool.includes(MatchAction.HOLD));

  const userMidfieldPool = resolvePool(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.MIDFIELD,
  );
  assert(userMidfieldPool.includes(MatchAction.PASS));
  assert(userMidfieldPool.includes(MatchAction.DRIBBLE));
  assert(userMidfieldPool.includes(MatchAction.LONG_PASS));
  assert(userMidfieldPool.includes(MatchAction.ATTACK));

  const userAttackThirdPool = resolvePool(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.ATTACK_THIRD,
  );
  assert(userAttackThirdPool.includes(MatchAction.ATTACK));
  assert(userAttackThirdPool.includes(MatchAction.SHOOT));
  assert(userAttackThirdPool.includes(MatchAction.LONG_PASS));

  const userBoxPool = resolvePool(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.BOX,
  );
  assert(userBoxPool.includes(MatchAction.SHOOT));
  assert(userBoxPool.includes(MatchAction.DRIBBLE));
  assert(userBoxPool.includes(MatchAction.ATTACK));

  // Visible options guardrail: SHOOT must always be present in user ATTACK_THIRD/BOX.
  const userAttackThirdOptions = buildOptions(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.ATTACK_THIRD,
  );
  assert(
    extractTurnActions(userAttackThirdOptions).includes(MatchAction.SHOOT),
    'BALL_POSSESSION_EVENT user ATTACK_THIRD should always expose SHOOT',
  );
  const userBoxOptions = buildOptions(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.USER,
    MatchFieldZone.BOX,
  );
  assert(
    extractTurnActions(userBoxOptions).includes(MatchAction.SHOOT),
    'BALL_POSSESSION_EVENT user BOX should always expose SHOOT',
  );

  const opponentMidfieldPool = resolvePool(
    service,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchPossession.OPPONENT,
    MatchFieldZone.MIDFIELD,
  );
  assertOnlyDefensive(opponentMidfieldPool, 'BALL_POSSESSION_EVENT + opponent possession');

  // Non-locked events: options are always user-perspective by possession.
  const nonLockedPerspectiveEvents: MatchEventType[] = [
    MatchEventType.KICKOFF_EVENT,
    MatchEventType.BALL_POSSESSION_EVENT,
    MatchEventType.ATTACK_EVENT,
    MatchEventType.DEFENSE_EVENT,
    MatchEventType.YELLOW_CARD_EVENT,
    MatchEventType.RED_CARD_EVENT,
  ];

  for (const eventType of nonLockedPerspectiveEvents) {
    covered.add(eventType);
    assertSameActionSet(
      resolvePool(service, eventType, MatchPossession.USER, MatchFieldZone.MIDFIELD),
      userMidfieldPool,
      `${eventType} should follow user-on-ball pool`,
    );
    assertSameActionSet(
      resolvePool(service, eventType, MatchPossession.OPPONENT, MatchFieldZone.MIDFIELD),
      opponentMidfieldPool,
      `${eventType} should follow defensive pool when opponent has possession`,
    );
  }

  // FOR/AGAINST locked events: they should ignore possession and keep fixed user-perspective pools.
  const lockedEventsExpected: Array<[MatchEventType, MatchAction[]]> = [
    [
      MatchEventType.FREE_KICK_FOR_EVENT,
      [MatchAction.CROSS, MatchAction.LONG_PASS, MatchAction.SHOOT, MatchAction.PASS],
    ],
    [
      MatchEventType.FREE_KICK_AGAINST_EVENT,
      [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    ],
    [
      MatchEventType.PENALTY_FOR_EVENT,
      [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    ],
    [
      MatchEventType.PENALTY_AGAINST_EVENT,
      [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    ],
    [
      MatchEventType.CORNER_FOR_EVENT,
      [MatchAction.CROSS, MatchAction.PASS, MatchAction.SHOOT, MatchAction.LONG_PASS],
    ],
    [
      MatchEventType.CORNER_AGAINST_EVENT,
      [MatchAction.BLOCK, MatchAction.DEFEND, MatchAction.PRESS, MatchAction.TACKLE],
    ],
    [
      MatchEventType.THROW_IN_FOR_EVENT,
      [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.DRIBBLE, MatchAction.HOLD],
    ],
    [
      MatchEventType.THROW_IN_AGAINST_EVENT,
      [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    ],
    [
      MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT,
      [MatchAction.SHOOT, MatchAction.DRIBBLE, MatchAction.ATTACK, MatchAction.CENTER],
    ],
    [
      MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT,
      [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    ],
    [
      MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT,
      [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    ],
    [
      MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT,
      [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    ],
  ];

  for (const [eventType, expectedActions] of lockedEventsExpected) {
    covered.add(eventType);
    const userPool = resolvePool(service, eventType, MatchPossession.USER, MatchFieldZone.BOX);
    const opponentPool = resolvePool(service, eventType, MatchPossession.OPPONENT, MatchFieldZone.BOX);
    assertSameActionSet(userPool, expectedActions, `${eventType} user pool`);
    assertSameActionSet(opponentPool, expectedActions, `${eventType} opponent pool`);
  }

  assertOnlyGoalkeeper(
    resolvePool(
      service,
      MatchEventType.PENALTY_AGAINST_EVENT,
      MatchPossession.USER,
      MatchFieldZone.BOX,
    ),
    'PENALTY_AGAINST_EVENT goalkeeper actions',
  );

  assertOnlyGoalkeeper(
    resolvePool(
      service,
      MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT,
      MatchPossession.USER,
      MatchFieldZone.BOX,
    ),
    'LAST_PLAY_PENALTY_AGAINST_EVENT goalkeeper actions',
  );

  // FORFEIT_EVENT / END should return no options.
  covered.add(MatchEventType.FORFEIT_EVENT);
  covered.add(MatchEventType.END);
  assert.deepEqual(
    buildOptions(service, MatchEventType.FORFEIT_EVENT, MatchPossession.USER, MatchFieldZone.MIDFIELD),
    [],
    'FORFEIT_EVENT should return no options',
  );
  assert.deepEqual(
    buildOptions(service, MatchEventType.END, MatchPossession.USER, MatchFieldZone.MIDFIELD),
    [],
    'END should return no options',
  );

  // LAST_PLAY_ONE_ON_ONE_FOR_EVENT must always include SHOOT in the visible options.
  const lastPlayOptions = buildOptions(
    service,
    MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT,
    MatchPossession.USER,
    MatchFieldZone.BOX,
  );
  assert(
    extractTurnActions(lastPlayOptions).includes(MatchAction.SHOOT),
    'LAST_PLAY_ONE_ON_ONE_FOR_EVENT should always expose SHOOT',
  );

  // For playable events, option #4 must stay QUIT_MATCH.
  const nonPlayableEvents = new Set<MatchEventType>([
    MatchEventType.HALF_TIME_EVENT,
    MatchEventType.FORFEIT_EVENT,
    MatchEventType.END,
  ]);

  for (const eventType of Object.values(MatchEventType)) {
    if (nonPlayableEvents.has(eventType)) {
      continue;
    }

    const options = buildOptions(service, eventType, MatchPossession.USER, MatchFieldZone.MIDFIELD);
    assert.equal(options.length, 4, `${eventType}: expected 4 options`);
    assert.equal(options[3].action, MatchAction.QUIT_MATCH, `${eventType}: option #4 should be QUIT_MATCH`);
  }

  // Exhaustive coverage: every MatchEventType is explicitly validated.
  const allEvents = Object.values(MatchEventType);
  assert.equal(covered.size, allEvents.length, 'Expected explicit validation count for all MatchEventType values');
  for (const eventType of allEvents) {
    assert(covered.has(eventType), `Missing explicit validation for ${eventType}`);
  }

  console.log('OK - exhaustive match options matrix battery passed.');
}

run();
