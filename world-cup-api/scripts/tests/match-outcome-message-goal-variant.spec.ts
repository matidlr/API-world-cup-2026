import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { I18nService } from '../../src/i18n/i18n.service';
import { MatchEntity } from '../../src/match/entity/match.entity';
import {
  MatchOutcomeNarrativeMode,
} from '../../src/match/interfaces/match-outcome-message.interface';
import { MatchActionOutcomeResult } from '../../src/match/interfaces/match-action-outcome.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { MatchNarrativeVariantHelper } from '../../src/match/helper/match-narrative-variant.helper';
import { MatchOutcomeMessageHelper } from '../../src/match/helper/match-outcome-message.helper';

function createMatch(): MatchEntity {
  return {
    matchId: 'm1',
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'bra',
    opponentName: 'Brazil',
  } as MatchEntity;
}

function createGoalOutcome(
  actionOutcome: MatchActionOutcome,
  scorerTeamId: string,
  scorerTeamName: string,
): MatchActionOutcomeResult {
  return {
    scoreTeam: scorerTeamId === 'arg' ? 1 : 0,
    scoreOpponent: scorerTeamId === 'bra' ? 1 : 0,
    message: '',
    isGoal: true,
    goalMessageKey: scorerTeamId === 'arg' ? 'match.turn.userGoal' : 'match.turn.opponentGoal',
    statTeamId: scorerTeamId,
    statTeamName: scorerTeamName,
    statPlayerName: 'Scorer',
    statPlayerPosition: 'FW',
    statAction: MatchAction.SHOOT,
    ballCarrierTeamId: scorerTeamId,
    ballCarrierName: 'Scorer',
    actionOutcome,
    nextZone: MatchFieldZone.MIDFIELD,
    nextPossession:
      scorerTeamId === 'arg' ? MatchPossession.USER : MatchPossession.OPPONENT,
    nextEventType: MatchEventType.KICKOFF_EVENT,
    actingPlayer: {
      playerId: 'p1',
      name: 'Scorer',
      position: 'FW',
      shirtNumber: 9,
      age: 27,
      skill: 90,
      attack: 90,
      defense: 40,
      energy: 80,
      isCaptain: false,
    },
    incidents: [],
  };
}

function run() {
  const i18nService = new I18nService();
  const variantHelper = new MatchNarrativeVariantHelper(i18nService);
  const helper = new MatchOutcomeMessageHelper(i18nService, variantHelper);
  const match = createMatch();

  const userGoalDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_USER_GOAL,
      match.teamId,
      match.teamName,
    ),
    action: MatchAction.SHOOT,
    minute: 22,
    turn: 3,
    mode: MatchOutcomeNarrativeMode.REGULAR,
  });
  assert.ok(
    userGoalDescriptor.key.startsWith('match.turn.result.outcome.SHOOT_USER_GOAL.'),
    `Expected SHOOT_USER_GOAL variant key, got: ${userGoalDescriptor.key}`,
  );

  const opponentGoalDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_OPPONENT_GOAL,
      match.opponentId,
      match.opponentName,
    ),
    action: MatchAction.SHOOT,
    minute: 39,
    turn: 4,
    mode: MatchOutcomeNarrativeMode.REGULAR,
  });
  assert.ok(
    opponentGoalDescriptor.key.startsWith('match.turn.result.outcome.SHOOT_OPPONENT_GOAL.'),
    `Expected SHOOT_OPPONENT_GOAL variant key, got: ${opponentGoalDescriptor.key}`,
  );

  const lastPlayDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_USER_GOAL,
      match.teamId,
      match.teamName,
    ),
    action: MatchAction.SHOOT,
    minute: 90,
    turn: 10,
    mode: MatchOutcomeNarrativeMode.LAST_PLAY,
    lastPlayAttackingTeamId: match.teamId,
  });
  assert.ok(
    lastPlayDescriptor.key.startsWith('match.lastPlay.attackGoal.for.'),
    `Expected LAST_PLAY attack goal FOR variant key, got: ${lastPlayDescriptor.key}`,
  );

  const lastPlayAgainstDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_OPPONENT_GOAL,
      match.opponentId,
      match.opponentName,
    ),
    action: MatchAction.SHOOT,
    minute: 90,
    turn: 10,
    mode: MatchOutcomeNarrativeMode.LAST_PLAY,
    lastPlayAttackingTeamId: match.opponentId,
  });
  assert.ok(
    lastPlayAgainstDescriptor.key.startsWith('match.lastPlay.attackGoal.against.'),
    `Expected LAST_PLAY attack goal AGAINST variant key, got: ${lastPlayAgainstDescriptor.key}`,
  );

  const lastPlayCounterForDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_USER_GOAL,
      match.teamId,
      match.teamName,
    ),
    action: MatchAction.SHOOT,
    minute: 90,
    turn: 10,
    mode: MatchOutcomeNarrativeMode.LAST_PLAY,
    lastPlayAttackingTeamId: match.opponentId,
  });
  assert.ok(
    lastPlayCounterForDescriptor.key.startsWith('match.lastPlay.counterGoal.for.'),
    `Expected LAST_PLAY counter goal FOR variant key, got: ${lastPlayCounterForDescriptor.key}`,
  );

  const lastPlayCounterAgainstDescriptor = helper.resolveOutcomeMessage({
    match,
    turnOutcome: createGoalOutcome(
      MatchActionOutcome.SHOOT_OPPONENT_GOAL,
      match.opponentId,
      match.opponentName,
    ),
    action: MatchAction.SHOOT,
    minute: 90,
    turn: 10,
    mode: MatchOutcomeNarrativeMode.LAST_PLAY,
    lastPlayAttackingTeamId: match.teamId,
  });
  assert.ok(
    lastPlayCounterAgainstDescriptor.key.startsWith('match.lastPlay.counterGoal.against.'),
    `Expected LAST_PLAY counter goal AGAINST variant key, got: ${lastPlayCounterAgainstDescriptor.key}`,
  );

  console.log('OK - outcome message goal variant routing passed.');
}

run();
