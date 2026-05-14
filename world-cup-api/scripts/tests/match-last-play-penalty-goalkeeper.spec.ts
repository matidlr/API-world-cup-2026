import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';
import { MatchPlaySpecialEventResponseHelper } from '../../src/match/helper/match-play-special-event-response.helper';
import { MatchPlayerSelectionHelper } from '../../src/match/helper/match-player-selection.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p',
    name: 'Player',
    position: 'MF',
    shirtNumber: 8,
    age: 27,
    skill: 80,
    attack: 78,
    defense: 72,
    energy: 80,
    isCaptain: false,
    ...overrides,
  };
}

async function runLastPlayPenaltyAgainstGoalkeeperCheck(): Promise<void> {
  const pipeline = Object.create(MatchPlayTurnPipelineHelper.prototype) as any;
  pipeline.matchPlayerSelectionHelper = new MatchPlayerSelectionHelper();
  pipeline.randomInt = (_min: number, _max: number) => 3;
  pipeline.i18nService = {
    t: (key: string, _lang: 'en' | 'es', params?: Record<string, string>) => {
      if (key === 'match.lastPlay.tension') {
        return 'LAST_PLAY_TENSION';
      }
      if (key.startsWith('match.lastPlay.penalty.against.')) {
        return `LAST_PLAY_PENALTY_AGAINST ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      if (key.startsWith('match.lastPlay.penalty.for.')) {
        return `LAST_PLAY_PENALTY_FOR ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      if (key.startsWith('match.lastPlay.oneOnOne.for.')) {
        return `LAST_PLAY_ONE_ON_ONE_FOR ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      if (key.startsWith('match.lastPlay.oneOnOne.against.')) {
        return `LAST_PLAY_ONE_ON_ONE_AGAINST ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      if (key === 'match.lastPlay.penalty') {
        return `LEGACY_LAST_PLAY_PENALTY ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      if (key === 'match.lastPlay.oneOnOne') {
        return `LEGACY_LAST_PLAY_ONE_ON_ONE ${params?.attackerName} vs ${params?.goalkeeperName}`;
      }
      return key;
    },
  };

  pipeline.pickLastPlayEventType = () => MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT;
  pipeline.recordMatchStat = async () => undefined;

  const match = {
    matchId: 'm_last_play',
    maxTurns: 10,
    turn: 10,
    minute: 90,
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'gha',
    opponentName: 'Ghana',
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    currentZone: null,
    possessionTeam: MatchPossession.USER,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Carrier',
    message: '',
  } as any;

  const userPlayers = [
    player({ playerId: 'arg_df', name: 'Cristian Romero', position: 'DF' }),
    player({ playerId: 'arg_mf', name: 'Enzo Fernandez', position: 'MF' }),
    player({ playerId: 'arg_gk', name: 'Emiliano Martinez', position: 'GK' }),
  ];

  const opponentPlayers = [
    player({ playerId: 'gha_fw', name: 'Joseph Paintsil', position: 'FW' }),
    player({ playerId: 'gha_mf', name: 'Mohammed Kudus', position: 'MF' }),
  ];

  const turnMessages = { en: [] as string[], es: [] as string[] };
  const turnMessageItems: any[] = [];

  await pipeline.prepareLastPlayTurn({
    match,
    language: 'es',
    turnMessages,
    turnMessageItems,
    userPlayers,
    opponentPlayers,
  });

  const scenarioMessage = turnMessages.en.find((message) => message.startsWith('LAST_PLAY_PENALTY_AGAINST'));
  assert.ok(scenarioMessage, 'Last-play penalty scenario message should be present.');
  assert.ok(
    scenarioMessage?.includes('Emiliano Martinez'),
    `Penalty scenario must face attacker vs goalkeeper. Received: ${scenarioMessage}`,
  );
}

async function runLastPlayScenarioVariantMappingCheck(): Promise<void> {
  const pipeline = Object.create(MatchPlayTurnPipelineHelper.prototype) as any;
  pipeline.matchPlayerSelectionHelper = new MatchPlayerSelectionHelper();
  pipeline.recordMatchStat = async () => undefined;
  pipeline.randomInt = (_min: number, _max: number) => 4;

  const capturedScenarioKeys: string[] = [];
  pipeline.i18nService = {
    t: (key: string, _lang: 'en' | 'es', _params?: Record<string, string>) => {
      if (key.startsWith('match.lastPlay.penalty.') || key.startsWith('match.lastPlay.oneOnOne.')) {
        capturedScenarioKeys.push(key);
        return `TRANSLATED:${key}`;
      }
      if (key === 'match.lastPlay.tension') {
        return 'TENSION';
      }
      return key;
    },
  };

  const matchBase = {
    matchId: 'm_last_play_variants',
    maxTurns: 10,
    turn: 10,
    minute: 90,
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'gha',
    opponentName: 'Ghana',
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    currentZone: null,
    possessionTeam: MatchPossession.USER,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Carrier',
    message: '',
  } as any;

  const userPlayers = [
    player({ playerId: 'arg_fw', name: 'Nico Paz', position: 'FW' }),
    player({ playerId: 'arg_gk', name: 'Emiliano Martinez', position: 'GK' }),
  ];
  const opponentPlayers = [
    player({ playerId: 'gha_fw', name: 'Joseph Paintsil', position: 'FW' }),
    player({ playerId: 'gha_gk', name: 'Richard Ofori', position: 'GK' }),
  ];

  const cases: Array<{ eventType: MatchEventType; expectedPrefix: string }> = [
    {
      eventType: MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT,
      expectedPrefix: 'match.lastPlay.penalty.for.4',
    },
    {
      eventType: MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT,
      expectedPrefix: 'match.lastPlay.penalty.against.4',
    },
    {
      eventType: MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT,
      expectedPrefix: 'match.lastPlay.oneOnOne.for.4',
    },
    {
      eventType: MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT,
      expectedPrefix: 'match.lastPlay.oneOnOne.against.4',
    },
  ];

  for (const c of cases) {
    capturedScenarioKeys.length = 0;
    const match = { ...matchBase };
    pipeline.pickLastPlayEventType = () => c.eventType;
    await pipeline.prepareLastPlayTurn({
      match,
      language: 'es',
      turnMessages: { en: [], es: [] },
      turnMessageItems: [],
      userPlayers,
      opponentPlayers,
    });
    assert.ok(
      capturedScenarioKeys.some((key) => key === c.expectedPrefix),
      `Expected scenario key ${c.expectedPrefix} for event ${c.eventType}. Captured: ${JSON.stringify(
        capturedScenarioKeys,
      )}`,
    );
  }
}

async function runLastPlayResolutionSingleScenarioCheck(): Promise<void> {
  const specialEventResponse = Object.create(MatchPlaySpecialEventResponseHelper.prototype) as any;
  specialEventResponse.matchPlayerSelectionHelper = new MatchPlayerSelectionHelper();
  specialEventResponse.i18nService = {
    t: (key: string, _lang: 'en' | 'es', params?: Record<string, string>) => {
      if (key === 'match.turn.selectedAction') {
        return `SELECTED_${params?.actionLabel}`;
      }
      if (key.startsWith('match.action.')) {
        return key.replace('match.action.', '');
      }
      if (key === 'match.lastPlay.attackGoal') {
        return `ATTACK_GOAL ${params?.playerName} ${params?.teamName}`;
      }
      if (key === 'match.lastPlay.counterGoal') {
        return `COUNTER_GOAL ${params?.playerName} ${params?.teamName}`;
      }
      if (key === 'match.turn.final') {
        return `FINAL ${params?.finalMessage}`;
      }
      return key;
    },
  };
  specialEventResponse.teamsService = {
    getTeamPlayers: async (_teamId: string) => [
      player({ playerId: 'gk_fallback', name: 'Fallback GK', position: 'GK' }),
    ],
  };
  specialEventResponse.matchRepository = {
    save: async (value: unknown) => value,
  };
  specialEventResponse.worldCupService = {
    markFinalEnded: async () => undefined,
  };
  specialEventResponse.recordMatchStat = async () => undefined;
  let recordedEndContextPayload: any = null;
  specialEventResponse.recordMatchTurnContext = async (payload: unknown) => {
    recordedEndContextPayload = payload;
  };
  specialEventResponse.matchTurnFlowHelper = {
    buildResponseContext: async ({ match, options, lastAction, lastOutcome }: any) => ({
      matchId: match.matchId,
      turn: match.turn,
      minute: match.minute,
      eventType: match.eventType,
      zone: match.currentZone,
      possession: match.possessionTeam,
      userTeamId: match.teamId,
      userTeamName: match.teamName,
      opponentTeamId: match.opponentId,
      opponentTeamName: match.opponentName,
      actingTeamId: match.ballCarrierTeamId,
      actingTeamName: match.ballCarrierTeamId === match.teamId ? match.teamName : match.opponentName,
      defendingTeamId: match.ballCarrierTeamId === match.teamId ? match.opponentId : match.teamId,
      defendingTeamName: match.ballCarrierTeamId === match.teamId ? match.opponentName : match.teamName,
      actingPlayer: player({ playerId: 'ctx_player', name: 'Context Player', position: 'MF' }),
      teammatesInZone: [],
      opponentsInZone: [],
      actingOnFieldCount: 11,
      defendingOnFieldCount: 11,
      tacticalSnapshot: {},
      availableActions: options.map((option: any) => option.action),
      isPendingSetPiece: false,
      isRivalryMatch: false,
      lastAction,
      lastOutcome,
    }),
  };
  specialEventResponse.matchTacticalHelper = {
    parseStrategy: (value: unknown) => value,
    parseFormation: (value: unknown) => value,
    buildTacticalSnapshot: () => ({}),
  };
  specialEventResponse.actionsByEvent = {};
  specialEventResponse.matchTurnOptionsHelper = {
    buildOptions: () => [{ index: 1, label: 'Option', action: MatchAction.RIGHT }],
  };
  specialEventResponse.matchActionOutcomeHelper = {
    resolveActionOutcome: () => ({
      scoreTeam: 0,
      scoreOpponent: 1,
      message: 'COUNTER_GOAL Joseph Aidoo Ghana',
      isGoal: true,
      goalMessageKey: 'match.turn.opponentCounterGoal',
      statTeamId: 'gha',
      statTeamName: 'Ghana',
      statPlayerName: 'Joseph Aidoo',
      statPlayerPosition: 'DF',
      statAction: MatchAction.RIGHT,
      ballCarrierTeamId: 'gha',
      ballCarrierName: 'Joseph Aidoo',
      actionOutcome: MatchActionOutcome.SHOOT_MISSED,
      nextZone: MatchFieldZone.BOX,
      nextPossession: MatchPossession.OPPONENT,
      nextEventType: MatchEventType.END,
      actingPlayer: player({ playerId: 'gha_df', name: 'Joseph Aidoo', position: 'DF' }),
      incidents: [],
    }),
  };
  specialEventResponse.matchOutcomeMessageHelper = {
    resolveOutcomeMessage: ({ turnOutcome, lastPlayAttackingTeamId }: any) => ({
      type: 'RESULT',
      key:
        turnOutcome.statTeamId === lastPlayAttackingTeamId
          ? 'match.lastPlay.attackGoal'
          : 'match.lastPlay.counterGoal',
      params: {
        playerName: turnOutcome.statPlayerName,
        teamName: turnOutcome.statTeamName,
      },
      metadata: {
        minute: 90,
        turn: 10,
        teamId: turnOutcome.statTeamId,
        teamName: turnOutcome.statTeamName,
        playerName: turnOutcome.statPlayerName,
      },
      timelineMessageEn: turnOutcome.message,
      incidentType: null,
    }),
  };
  specialEventResponse.matchTurnOutputHelper = {
    finalizeTurnOutput: ({ bundle, localizedItems }: any) => ({
      headline: bundle.en[0],
      messageItems: localizedItems.map((item: any) => ({
        type: item.type,
        text: item.en,
        minute: item.minute,
        turn: item.turn,
        teamId: item.teamId ?? null,
        teamName: item.teamName ?? null,
        playerName: item.playerName ?? null,
      })),
    }),
  };
  specialEventResponse.buildFinalMessageLocalized = () => 'FINAL_MESSAGE';
  let passedCurrentContext: any = null;
  specialEventResponse.toMatchResponse = async (
    saved: any,
    _language: 'en' | 'es',
    messageItems: Array<{ text: string }>,
    currentContext?: unknown,
  ) => {
    passedCurrentContext = currentContext;
    return {
      messageItems,
      possession: saved.possessionTeam,
      eventType: saved.eventType,
      currentContext: currentContext ?? null,
    };
  };
  specialEventResponse.resolveLastPlayAttackSuccess = () => false;

  const match = {
    matchId: 'm_last_play_resolution',
    maxTurns: 10,
    turn: 10,
    minute: 90,
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'gha',
    opponentName: 'Ghana',
    eventType: MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT,
    currentZone: null,
    possessionTeam: MatchPossession.USER,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Nico Paz',
    message: '',
    scoreTeam: 0,
    scoreOpponent: 0,
  } as any;

  const userPlayers = [
    player({ playerId: 'arg_fw', name: 'Nico Paz', position: 'FW' }),
    player({ playerId: 'arg_mf', name: 'Leandro Paredes', position: 'MF' }),
  ];

  const opponentPlayers = [
    player({ playerId: 'gha_df', name: 'Joseph Aidoo', position: 'DF' }),
    player({ playerId: 'gha_mf', name: 'Mohammed Kudus', position: 'MF' }),
  ];

  const turnMessages = {
    en: ['LAST_PLAY_PENALTY Nico Paz vs Fallback GK'] as string[],
    es: ['LAST_PLAY_PENALTY Nico Paz vs Fallback GK'] as string[],
  };
  const turnMessageItems: any[] = [];

  const response = await specialEventResponse.resolveLastPlayTurn({
    match,
    selectedAction: MatchAction.RIGHT,
    language: 'es',
    turnMessages,
    turnMessageItems,
    userPlayers,
    opponentPlayers,
  });

  const scenarioMessages = turnMessages.en.filter((message) => message.startsWith('LAST_PLAY_PENALTY'));
  assert.equal(
    scenarioMessages.length,
    1,
    `Last-play scenario must be emitted once. Received: ${JSON.stringify(scenarioMessages)}`,
  );
  assert.ok(
    turnMessages.en.some((message) => message === 'SELECTED_RIGHT'),
    `Last-play resolution must include the selected action message. Messages: ${JSON.stringify(
      turnMessages.en,
    )}`,
  );

  assert.equal(match.eventType, MatchEventType.END, 'Last-play match must close with END event type.');
  assert.ok(match.lastContextJson, 'Last-play resolution must persist lastContextJson.');
  const persistedContext = JSON.parse(match.lastContextJson);
  assert.equal(
    persistedContext.eventType,
    MatchEventType.END,
    'Persisted context must be synchronized to END in last-play closure.',
  );
  assert.equal(
    persistedContext.possession,
    match.possessionTeam,
    'Persisted context possession must match final match possession.',
  );

  assert.ok(recordedEndContextPayload, 'Last-play closure must record turn context payload.');
  assert.equal(recordedEndContextPayload.phase, 'END', 'Last-play closure context phase must be END.');
  assert.equal(
    recordedEndContextPayload.context?.eventType,
    MatchEventType.END,
    'Recorded END context must carry END event type.',
  );

  assert.ok(passedCurrentContext, 'Response mapper should receive explicit final currentContext.');
  assert.equal(
    (response as any).currentContext?.eventType,
    MatchEventType.END,
    'Returned response currentContext must be END after last-play closure.',
  );
  assert.equal(
    (response as any).currentContext?.possession,
    (response as any).possession,
    'Returned response possession must match currentContext possession on last-play END.',
  );
}

async function run(): Promise<void> {
  await runLastPlayPenaltyAgainstGoalkeeperCheck();
  await runLastPlayScenarioVariantMappingCheck();
  await runLastPlayResolutionSingleScenarioCheck();
  console.log('OK - last play penalty goalkeeper coherence checks passed.');
}

run();
