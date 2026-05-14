import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchActionOutcomeHelper } from '../../src/match/helper/match-action-outcome.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchActionOutcomeIncidentType } from '../../src/match/model/match-action-outcome-incident-type.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';
import { TacticalSnapshot } from '../../src/match/interfaces/match-tactical-snapshot.interface';
import { TurnContext } from '../../src/match/interfaces/match-turn-context.interface';

function player(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p1',
    name: 'Player 1',
    position: 'MF',
    shirtNumber: 8,
    age: 27,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 80,
    isCaptain: false,
    ...overrides,
  };
}

function tactical(): TacticalSnapshot {
  return {
    teamStrategy: null,
    teamFormation: null,
    opponentStrategy: null,
    opponentFormation: null,
    teamPenaltyPoints: 0,
    opponentPenaltyPoints: 0,
    teamLine: { attack: 80, defense: 80, midfield: 80 },
    opponentLine: { attack: 80, defense: 80, midfield: 80 },
  };
}

function matchStub() {
  return {
    scoreTeam: 0,
    scoreOpponent: 0,
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'fra',
    opponentName: 'France',
  } as any;
}

function contextSnapshot(
  turnContext: TurnContext,
  userPlayers: TeamPlayer[],
  opponentPlayers: TeamPlayer[],
): MatchCurrentContext {
  return {
    matchId: 'm1',
    turn: 1,
    minute: 10,
    eventType: turnContext.eventType,
    zone: turnContext.zone,
    possession: turnContext.possession,
    userTeamId: 'arg',
    userTeamName: 'Argentina',
    opponentTeamId: 'fra',
    opponentTeamName: 'France',
    actingTeamId: turnContext.actingTeamId,
    actingTeamName: turnContext.actingTeamName,
    defendingTeamId: turnContext.possession === MatchPossession.USER ? 'fra' : 'arg',
    defendingTeamName: turnContext.possession === MatchPossession.USER ? 'France' : 'Argentina',
    actingPlayer: turnContext.actingPlayer,
    teammatesInZone: turnContext.possession === MatchPossession.USER ? userPlayers : opponentPlayers,
    opponentsInZone: turnContext.possession === MatchPossession.USER ? opponentPlayers : userPlayers,
    actingOnFieldCount: 11,
    defendingOnFieldCount: 11,
    tacticalSnapshot: tactical(),
    availableActions: [MatchAction.PASS, MatchAction.SHOOT],
    isPendingSetPiece: false,
    isRivalryMatch: false,
  };
}

function createHarness(config: {
  teamGoal?: boolean;
  opponentGoal?: boolean;
  defensiveRecovery?: boolean;
  duelOutcome?: MatchActionOutcome;
  duelNextZone?: MatchFieldZone;
  duelNextPossession?: MatchPossession;
  openPlayRestart?: MatchEventType | null;
  openPlayRestartPossession?: MatchPossession;
}) {
  const helper: any = Object.create(MatchActionOutcomeHelper.prototype);
  helper['i18nService'] = {
    t: (key: string) => key,
  };
  helper['matchNarrativeHelper'] = {
    describeZone: () => 'zone',
  };
  helper['matchProbabilityHelper'] = {
    resolveTeamGoalChance: () => config.teamGoal ?? false,
    resolveOpponentGoalChance: () => config.opponentGoal ?? false,
    resolveCounterChance: () => false,
    resolvePostMissedShotPossession: () => MatchPossession.USER,
    resolveDefensiveRecoveryChance: () => config.defensiveRecovery ?? false,
  };
  helper['matchGoalScorerHelper'] = {
    pickScorerForGoal: ({ fallbackPlayer }: { fallbackPlayer: TeamPlayer }) => fallbackPlayer,
  };
  helper['matchTurnOptionsHelper'] = {
    pickOpponentAction: () => MatchAction.ATTACK,
  };
  helper['matchPlayerSelectionHelper'] = {
    pickPlayerForAction: (players: TeamPlayer[]) => players[0],
  };
  helper['matchActionTransitionHelper'] = {
    resolveTransition: ({
      context,
    }: {
      context: MatchCurrentContext;
      actionOutcome: MatchActionOutcome;
      action: MatchAction;
    }) => ({
      nextZone: config.duelNextZone ?? context.zone,
      nextPossession: config.duelNextPossession ?? context.possession,
      nextEventType:
        (config.duelNextPossession ?? context.possession) === MatchPossession.USER
          ? MatchEventType.BALL_POSSESSION_EVENT
          : MatchEventType.DEFENSE_EVENT,
      nextActingPlayer: context.actingPlayer,
    }),
  };
  helper['matchDuelHelper'] = {
    resolveDuel: ({
      context,
      action,
    }: {
      context: MatchCurrentContext;
      action: MatchAction;
    }) => ({
      handled:
        action === MatchAction.PASS ||
        action === MatchAction.LONG_PASS ||
        action === MatchAction.DRIBBLE ||
        action === MatchAction.SHOOT,
      success: true,
      fromPlayer: context.actingPlayer,
      toPlayer: context.actingPlayer,
      defenderPlayer: context.opponentsInZone[0] || context.actingPlayer,
      nextZone: config.duelNextZone ?? context.zone,
      nextPossession: config.duelNextPossession ?? context.possession,
      wasSavedByGoalkeeper: false,
      outcome: config.duelOutcome ?? MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    }),
  };
  helper['matchContextBuilderHelper'] = {
    getPlayersByZone: (players: TeamPlayer[]) => players,
  };
  helper['matchOpenPlayRestartHelper'] = {
    resolveOpenPlayRestartEvent: () => config.openPlayRestart ?? null,
    resolvePossessionFromRestartEvent: () =>
      config.openPlayRestartPossession ?? MatchPossession.USER,
  };
  helper['matchTurnOrchestratorHelper'] = {
    resolveOpenPlayRestartDescriptor: () => ({
      action: MatchAction.PASS,
      zone: MatchFieldZone.MIDFIELD,
      messageKey: 'match.restart.throwIn',
    }),
  };
  helper['matchPenaltyResolutionHelper'] = {
    resolvePenaltyAwardIncident: (params: {
      eventType: MatchEventType;
      match: { teamId: string; teamName: string; opponentId: string; opponentName: string };
      userPlayers: TeamPlayer[];
      opponentPlayers: TeamPlayer[];
      baseUserPlayers: TeamPlayer[];
      baseOpponentPlayers: TeamPlayer[];
    }) => {
      const awardedSide =
        params.eventType === MatchEventType.PENALTY_FOR_EVENT
          ? MatchPossession.USER
          : MatchPossession.OPPONENT;
      const sidePlayers =
        awardedSide === MatchPossession.USER
          ? params.userPlayers.length
            ? params.userPlayers
            : params.baseUserPlayers
          : params.opponentPlayers.length
            ? params.opponentPlayers
            : params.baseOpponentPlayers;
      const taker = sidePlayers[0];
      return {
        awardedSide,
        awardedTeamId: awardedSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId,
        awardedTeamName:
          awardedSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName,
        designatedPenaltyTaker: taker,
        incident: {
          type: MatchActionOutcomeIncidentType.PENALTY_AWARDED,
        },
      };
    },
    resolvePenaltySaveIncident: (params: {
      eventType: MatchEventType;
      match: { teamId: string; teamName: string; opponentId: string; opponentName: string };
      userPlayers: TeamPlayer[];
      opponentPlayers: TeamPlayer[];
      baseUserPlayers: TeamPlayer[];
      baseOpponentPlayers: TeamPlayer[];
    }) => {
      const defendingSide =
        params.eventType === MatchEventType.PENALTY_FOR_EVENT
          ? MatchPossession.OPPONENT
          : MatchPossession.USER;
      const sidePlayers =
        defendingSide === MatchPossession.USER
          ? params.userPlayers.length
            ? params.userPlayers
            : params.baseUserPlayers
          : params.opponentPlayers.length
            ? params.opponentPlayers
            : params.baseOpponentPlayers;
      const goalkeeper = sidePlayers.find((player) => player.position === 'GK') || sidePlayers[0];
      return {
        defendingSide,
        defendingTeamId:
          defendingSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId,
        defendingTeamName:
          defendingSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName,
        goalkeeper,
        incident: {
          type: MatchActionOutcomeIncidentType.PENALTY_SAVE,
          teamId: defendingSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId,
          teamName:
            defendingSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName,
          playerName: goalkeeper.name,
        },
      };
    },
  };

  return helper as MatchActionOutcomeHelper;
}

function testPenaltySaveIncident(): void {
  const helper = createHarness({ teamGoal: false, openPlayRestart: null });
  const userShooter = player({ playerId: 'u1', name: 'User Shooter', position: 'FW' });
  const userKeeper = player({ playerId: 'u_gk', name: 'User GK', position: 'GK' });
  const oppKeeper = player({ playerId: 'o_gk', name: 'Opp GK', position: 'GK' });
  const oppDef = player({ playerId: 'o1', name: 'Opp DF', position: 'DF' });

  const turnContext: TurnContext = {
    action: MatchAction.LEFT,
    eventType: MatchEventType.PENALTY_FOR_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.BOX,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userShooter,
  };

  const outcome = helper.resolveActionOutcome({
    match: matchStub(),
    context: turnContext,
    currentContext: contextSnapshot(turnContext, [userShooter, userKeeper], [oppKeeper, oppDef]),
    tactical: tactical(),
    userPlayers: [userShooter, userKeeper],
    opponentPlayers: [oppKeeper, oppDef],
    actionsByEvent: {} as any,
    baseUserPlayers: [userShooter, userKeeper],
    baseOpponentPlayers: [oppKeeper, oppDef],
    isExecutingRegularPenalty: true,
  });

  const penaltySaveIncident = outcome.incidents.find(
    (incident) => incident.type === MatchActionOutcomeIncidentType.PENALTY_SAVE,
  );
  assert.ok(penaltySaveIncident, 'expected penalty save incident for missed penalty');
  assert.equal(penaltySaveIncident?.teamId, 'fra');
  assert.equal(penaltySaveIncident?.teamName, 'France');
  assert.equal(penaltySaveIncident?.playerName, 'Opp GK');
}

function testOpenPlayRestartIncident(): void {
  const helper = createHarness({
    teamGoal: false,
    duelOutcome: MatchActionOutcome.PASS_INTERCEPTED,
    duelNextPossession: MatchPossession.OPPONENT,
    duelNextZone: MatchFieldZone.MIDFIELD,
    openPlayRestart: MatchEventType.THROW_IN_AGAINST_EVENT,
    openPlayRestartPossession: MatchPossession.OPPONENT,
  });
  const userPlayer = player({ playerId: 'u1', name: 'User MF', position: 'MF' });
  const oppPlayer = player({ playerId: 'o1', name: 'Opp MF', position: 'MF' });

  const turnContext: TurnContext = {
    action: MatchAction.PASS,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.MIDFIELD,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userPlayer,
  };

  const outcome = helper.resolveActionOutcome({
    match: matchStub(),
    context: turnContext,
    currentContext: contextSnapshot(turnContext, [userPlayer], [oppPlayer]),
    tactical: tactical(),
    userPlayers: [userPlayer],
    opponentPlayers: [oppPlayer],
    actionsByEvent: {} as any,
    baseUserPlayers: [userPlayer],
    baseOpponentPlayers: [oppPlayer],
    isExecutingRegularPenalty: true,
  });

  const restartIncident = outcome.incidents.find(
    (incident) => incident.type === MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
  );
  assert.ok(restartIncident, 'expected open-play restart incident');
  assert.equal(restartIncident?.eventType, MatchEventType.THROW_IN_AGAINST_EVENT);
  assert.equal(restartIncident?.possession, MatchPossession.OPPONENT);
  assert.equal(restartIncident?.messageKey, 'match.restart.throwIn');
}

function testOpenPlayRestartFollowsPostOutcomePossession(): void {
  const helper: any = createHarness({
    teamGoal: false,
    duelOutcome: MatchActionOutcome.PASS_INTERCEPTED,
    duelNextPossession: MatchPossession.OPPONENT,
    duelNextZone: MatchFieldZone.ATTACK_THIRD,
    openPlayRestart: null,
  });
  helper.matchOpenPlayRestartHelper = {
    resolveOpenPlayRestartEvent: (context: TurnContext) =>
      context.possession === MatchPossession.USER
        ? MatchEventType.CORNER_FOR_EVENT
        : MatchEventType.CORNER_AGAINST_EVENT,
    resolvePossessionFromRestartEvent: (eventType: MatchEventType) =>
      eventType === MatchEventType.CORNER_FOR_EVENT
        ? MatchPossession.USER
        : MatchPossession.OPPONENT,
  };
  helper.matchTurnOrchestratorHelper = {
    resolveOpenPlayRestartDescriptor: () => ({
      action: MatchAction.CROSS,
      zone: MatchFieldZone.BOX,
      messageKey: 'match.restart.corner',
    }),
  };

  const userPlayer = player({ playerId: 'u1', name: 'User MF', position: 'MF' });
  const oppPlayer = player({ playerId: 'o1', name: 'Opp MF', position: 'MF' });

  const turnContext: TurnContext = {
    action: MatchAction.PASS,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.MIDFIELD,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userPlayer,
  };

  const outcome = helper.resolveActionOutcome({
    match: matchStub(),
    context: turnContext,
    currentContext: contextSnapshot(turnContext, [userPlayer], [oppPlayer]),
    tactical: tactical(),
    userPlayers: [userPlayer],
    opponentPlayers: [oppPlayer],
    actionsByEvent: {} as any,
    baseUserPlayers: [userPlayer],
    baseOpponentPlayers: [oppPlayer],
    isExecutingRegularPenalty: true,
  });

  const restartIncident = outcome.incidents.find(
    (incident) => incident.type === MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
  );
  assert.ok(restartIncident, 'expected open-play restart incident');
  assert.equal(
    restartIncident?.eventType,
    MatchEventType.CORNER_AGAINST_EVENT,
    'Restart event should be derived from post-outcome possession (opponent after interception).',
  );
  assert.equal(restartIncident?.possession, MatchPossession.OPPONENT);
  assert.equal(restartIncident?.teamId, 'fra');
}

function run(): void {
  testPenaltySaveIncident();
  testOpenPlayRestartIncident();
  testOpenPlayRestartFollowsPostOutcomePossession();
  testExplicitNonDuelOutcomes();
  testShootMissedNeverTurnsIntoGoal();
  console.log('OK - action outcome incidents contract passed.');
}

run();

function testExplicitNonDuelOutcomes(): void {
  const userPlayer = player({ playerId: 'u1', name: 'User MF', position: 'MF' });
  const oppPlayer = player({ playerId: 'o1', name: 'Opp MF', position: 'MF' });

  const userCases: Array<{ action: MatchAction; expected: MatchActionOutcome }> = [
    { action: MatchAction.HOLD, expected: MatchActionOutcome.HOLD_STABLE },
    { action: MatchAction.ATTACK, expected: MatchActionOutcome.ATTACK_PROGRESS },
    { action: MatchAction.CROSS, expected: MatchActionOutcome.CROSS_CONNECTED },
  ];

  userCases.forEach(({ action, expected }) => {
    const helper = createHarness({ teamGoal: false });
    const turnContext: TurnContext = {
      action,
      eventType: MatchEventType.BALL_POSSESSION_EVENT,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.MIDFIELD,
      actingTeamId: 'arg',
      actingTeamName: 'Argentina',
      actingPlayer: userPlayer,
    };

    const outcome = helper.resolveActionOutcome({
      match: matchStub(),
      context: turnContext,
      currentContext: contextSnapshot(turnContext, [userPlayer], [oppPlayer]),
      tactical: tactical(),
      userPlayers: [userPlayer],
      opponentPlayers: [oppPlayer],
      actionsByEvent: {} as any,
      baseUserPlayers: [userPlayer],
      baseOpponentPlayers: [oppPlayer],
      isExecutingRegularPenalty: true,
    });

    assert.equal(outcome.actionOutcome, expected, `Expected explicit outcome for ${action}`);
  });

  const defensiveCases: Array<{
    action: MatchAction;
    defensiveRecovery: boolean;
    expected: MatchActionOutcome;
  }> = [
    { action: MatchAction.PRESS, defensiveRecovery: true, expected: MatchActionOutcome.PRESS_WON },
    { action: MatchAction.PRESS, defensiveRecovery: false, expected: MatchActionOutcome.PRESS_LOST },
    { action: MatchAction.TACKLE, defensiveRecovery: true, expected: MatchActionOutcome.TACKLE_WON },
    { action: MatchAction.TACKLE, defensiveRecovery: false, expected: MatchActionOutcome.TACKLE_LOST },
    { action: MatchAction.DEFEND, defensiveRecovery: true, expected: MatchActionOutcome.DEFEND_HOLD },
    { action: MatchAction.DEFEND, defensiveRecovery: false, expected: MatchActionOutcome.DEFEND_BROKEN },
  ];

  defensiveCases.forEach(({ action, defensiveRecovery, expected }) => {
    const helper = createHarness({ defensiveRecovery });
    const turnContext: TurnContext = {
      action,
      eventType: MatchEventType.DEFENSE_EVENT,
      possession: MatchPossession.OPPONENT,
      zone: MatchFieldZone.MIDFIELD,
      actingTeamId: 'fra',
      actingTeamName: 'France',
      actingPlayer: oppPlayer,
    };

    const outcome = helper.resolveActionOutcome({
      match: matchStub(),
      context: turnContext,
      currentContext: contextSnapshot(turnContext, [userPlayer], [oppPlayer]),
      tactical: tactical(),
      userPlayers: [userPlayer],
      opponentPlayers: [oppPlayer],
      actionsByEvent: {} as any,
      baseUserPlayers: [userPlayer],
      baseOpponentPlayers: [oppPlayer],
      isExecutingRegularPenalty: true,
    });

    assert.equal(outcome.actionOutcome, expected, `Expected explicit outcome for ${action}`);
  });
}

function testShootMissedNeverTurnsIntoGoal(): void {
  const helper = createHarness({
    teamGoal: true,
    duelOutcome: MatchActionOutcome.SHOOT_MISSED,
    duelNextPossession: MatchPossession.OPPONENT,
    duelNextZone: MatchFieldZone.ATTACK_THIRD,
    openPlayRestart: null,
  });
  const userShooter = player({ playerId: 'u9', name: 'User Shooter', position: 'FW' });
  const opponentDefender = player({ playerId: 'o1', name: 'Opp DF', position: 'DF' });

  const turnContext: TurnContext = {
    action: MatchAction.SHOOT,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.ATTACK_THIRD,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userShooter,
  };

  const outcome = helper.resolveActionOutcome({
    match: matchStub(),
    context: turnContext,
    currentContext: contextSnapshot(turnContext, [userShooter], [opponentDefender]),
    tactical: tactical(),
    userPlayers: [userShooter],
    opponentPlayers: [opponentDefender],
    actionsByEvent: {} as any,
    baseUserPlayers: [userShooter],
    baseOpponentPlayers: [opponentDefender],
    isExecutingRegularPenalty: true,
  });

  assert.equal(outcome.actionOutcome, MatchActionOutcome.SHOOT_MISSED);
  assert.equal(outcome.isGoal, false);
  assert.equal(outcome.scoreTeam, 0);
  assert.equal(outcome.nextPossession, MatchPossession.OPPONENT);
}
