import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchActionOutcomeHelper } from '../../src/match/helper/match-action-outcome.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { TacticalSnapshot } from '../../src/match/interfaces/match-tactical-snapshot.interface';
import { TurnContext } from '../../src/match/interfaces/match-turn-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchActionOutcomeIncidentType } from '../../src/match/model/match-action-outcome-incident-type.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function createPlayer(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p1',
    name: 'Player',
    position: 'MF',
    shirtNumber: 8,
    age: 26,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 80,
    isCaptain: false,
    ...overrides,
  };
}

function createTactical(): TacticalSnapshot {
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

function createMatchStub() {
  return {
    scoreTeam: 0,
    scoreOpponent: 0,
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'por',
    opponentName: 'Portugal',
  } as any;
}

function createCurrentContext(
  turnContext: TurnContext,
  userPlayers: TeamPlayer[],
  opponentPlayers: TeamPlayer[],
  tacticalSnapshot: TacticalSnapshot,
): MatchCurrentContext {
  return {
    matchId: 'm_test',
    turn: 1,
    minute: 1,
    eventType: turnContext.eventType,
    zone: turnContext.zone,
    possession: turnContext.possession,
    userTeamId: 'arg',
    userTeamName: 'Argentina',
    opponentTeamId: 'por',
    opponentTeamName: 'Portugal',
    actingTeamId: turnContext.actingTeamId,
    actingTeamName: turnContext.actingTeamName,
    defendingTeamId: turnContext.possession === MatchPossession.USER ? 'por' : 'arg',
    defendingTeamName: turnContext.possession === MatchPossession.USER ? 'Portugal' : 'Argentina',
    actingPlayer: turnContext.actingPlayer,
    teammatesInZone: turnContext.possession === MatchPossession.USER ? userPlayers : opponentPlayers,
    opponentsInZone: turnContext.possession === MatchPossession.USER ? opponentPlayers : userPlayers,
    actingOnFieldCount: turnContext.possession === MatchPossession.USER ? userPlayers.length : opponentPlayers.length,
    defendingOnFieldCount:
      turnContext.possession === MatchPossession.USER ? opponentPlayers.length : userPlayers.length,
    tacticalSnapshot,
    availableActions: [],
    isPendingSetPiece: false,
    isRivalryMatch: false,
  };
}

function createOutcomeHelperHarness(config: {
  action: MatchAction;
  duelOutcome: MatchActionOutcome;
  nextPossession: MatchPossession;
  nextZone: MatchFieldZone;
  duelToPlayer: TeamPlayer;
  invalidDuelToPlayer?: boolean;
}): MatchActionOutcomeHelper {
  const helper: any = Object.create(MatchActionOutcomeHelper.prototype);
  helper['i18nService'] = { t: (key: string) => key };
  helper['matchNarrativeHelper'] = { describeZone: () => 'zone' };
  helper['matchProbabilityHelper'] = {
    resolveTeamGoalChance: () => false,
    resolveOpponentGoalChance: () => false,
    resolveCounterChance: () => false,
    resolvePostMissedShotPossession: () => MatchPossession.USER,
    resolveDefensiveRecoveryChance: () => false,
  };
  helper['matchGoalScorerHelper'] = {
    pickScorerForGoal: ({ fallbackPlayer }: { fallbackPlayer: TeamPlayer }) => fallbackPlayer,
  };
  helper['matchTurnOptionsHelper'] = { pickOpponentAction: () => MatchAction.ATTACK };
  helper['matchActionTransitionHelper'] = {
    resolveTransition: ({ context }: { context: MatchCurrentContext }) => ({
      nextZone: config.nextZone,
      nextPossession: config.nextPossession,
      nextEventType:
        config.nextPossession === MatchPossession.USER
          ? MatchEventType.BALL_POSSESSION_EVENT
          : MatchEventType.DEFENSE_EVENT,
      nextActingPlayer: context.actingPlayer,
    }),
  };
  helper['matchOpenPlayRestartHelper'] = {
    resolveOpenPlayRestartEvent: () => null,
    resolvePossessionFromRestartEvent: () => MatchPossession.USER,
  };
  helper['matchTurnOrchestratorHelper'] = {
    resolveOpenPlayRestartDescriptor: () => ({
      action: MatchAction.PASS,
      zone: MatchFieldZone.MIDFIELD,
      messageKey: 'match.restart.freeKick',
    }),
  };
  helper['matchDuelHelper'] = {
    resolveDuel: ({ context }: { context: MatchCurrentContext }) => ({
      handled: true,
      outcome: config.duelOutcome,
      success: true,
      fromPlayer: context.actingPlayer,
      toPlayer: config.invalidDuelToPlayer
        ? {
            ...config.duelToPlayer,
            playerId: '',
            name: '',
          }
        : config.duelToPlayer,
      defenderPlayer: context.opponentsInZone[0] || context.actingPlayer,
      nextZone: config.nextZone,
      nextPossession: config.nextPossession,
      wasSavedByGoalkeeper: false,
    }),
  };
  helper['matchPlayerSelectionHelper'] = {
    pickPlayerForAction: (players: TeamPlayer[]) => players[0],
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
  return helper;
}

function runDuelActionUsesDuelToPlayerAsCarrier(
  action: MatchAction,
  outcome: MatchActionOutcome,
  nextPossession: MatchPossession,
): void {
  const userDf = createPlayer({ playerId: 'u_df', name: 'User DF', position: 'DF' });
  const userFw = createPlayer({ playerId: 'u_fw', name: 'User FW', position: 'FW' });
  const oppDf = createPlayer({ playerId: 'o_df', name: 'Opp DF', position: 'DF' });
  const oppMf = createPlayer({ playerId: 'o_mf', name: 'Opp MF', position: 'MF' });
  const duelToPlayer = nextPossession === MatchPossession.USER ? userFw : oppMf;

  const helper = createOutcomeHelperHarness({
    action,
    duelOutcome: outcome,
    nextPossession,
    nextZone: MatchFieldZone.ATTACK_THIRD,
    duelToPlayer,
  });

  const context: TurnContext = {
    action,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.MIDFIELD,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userDf,
  };

  const result = helper.resolveActionOutcome({
    match: createMatchStub(),
    context,
    currentContext: createCurrentContext(context, [userDf, userFw], [oppDf], createTactical()),
    tactical: createTactical(),
    userPlayers: [userDf, userFw],
    opponentPlayers: [oppDf],
    actionsByEvent: {} as any,
    baseUserPlayers: [userDf, userFw],
    baseOpponentPlayers: [oppDf],
    isExecutingRegularPenalty: true,
  });

  assert.equal(result.nextPossession, nextPossession);
  assert.equal(result.nextZone, MatchFieldZone.ATTACK_THIRD);
  assert.equal(result.ballCarrierName, duelToPlayer.name);
  assert.equal(
    result.ballCarrierTeamId,
    nextPossession === MatchPossession.USER ? 'arg' : 'por',
  );
}

function runInvalidDuelCarrierFallsBackToRosterSelection(): void {
  const userDf = createPlayer({ playerId: 'u_df', name: 'User DF', position: 'DF' });
  const userMf = createPlayer({ playerId: 'u_mf', name: 'User MF', position: 'MF' });
  const oppMf = createPlayer({ playerId: 'o_mf', name: 'Opp MF', position: 'MF' });

  const helper = createOutcomeHelperHarness({
    action: MatchAction.PASS,
    duelOutcome: MatchActionOutcome.PASS_INTERCEPTED,
    nextPossession: MatchPossession.USER,
    nextZone: MatchFieldZone.MIDFIELD,
    duelToPlayer: userMf,
    invalidDuelToPlayer: true,
  });

  const context: TurnContext = {
    action: MatchAction.PASS,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.USER,
    zone: MatchFieldZone.ATTACK_THIRD,
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    actingPlayer: userDf,
  };

  const result = helper.resolveActionOutcome({
    match: createMatchStub(),
    context,
    currentContext: createCurrentContext(context, [userDf], [oppMf], createTactical()),
    tactical: createTactical(),
    userPlayers: [userDf, userMf],
    opponentPlayers: [oppMf],
    actionsByEvent: {} as any,
    baseUserPlayers: [userDf, userMf],
    baseOpponentPlayers: [oppMf],
    isExecutingRegularPenalty: true,
  });

  assert.equal(result.nextPossession, MatchPossession.USER);
  assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
  assert.equal(result.ballCarrierName, userDf.name);
}

function run(): void {
  const scenarios: Array<{
    action: MatchAction;
    outcome: MatchActionOutcome;
    nextPossession: MatchPossession;
  }> = [
    {
      action: MatchAction.PASS,
      outcome: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
      nextPossession: MatchPossession.USER,
    },
    {
      action: MatchAction.PASS,
      outcome: MatchActionOutcome.PASS_INTERCEPTED,
      nextPossession: MatchPossession.OPPONENT,
    },
    {
      action: MatchAction.LONG_PASS,
      outcome: MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS,
      nextPossession: MatchPossession.USER,
    },
    {
      action: MatchAction.LONG_PASS,
      outcome: MatchActionOutcome.LONG_PASS_LOST,
      nextPossession: MatchPossession.OPPONENT,
    },
    {
      action: MatchAction.DRIBBLE,
      outcome: MatchActionOutcome.DRIBBLE_WON,
      nextPossession: MatchPossession.USER,
    },
    {
      action: MatchAction.DRIBBLE,
      outcome: MatchActionOutcome.DRIBBLE_LOST,
      nextPossession: MatchPossession.OPPONENT,
    },
    {
      action: MatchAction.SHOOT,
      outcome: MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR,
      nextPossession: MatchPossession.USER,
    },
    {
      action: MatchAction.SHOOT,
      outcome: MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST,
      nextPossession: MatchPossession.OPPONENT,
    },
  ];

  for (const scenario of scenarios) {
    runDuelActionUsesDuelToPlayerAsCarrier(
      scenario.action,
      scenario.outcome,
      scenario.nextPossession,
    );
  }

  runInvalidDuelCarrierFallsBackToRosterSelection();
  console.log('OK - duel carrier source-of-truth checks passed for all duel actions.');
}

run();
