import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchActionOutcomeHelper } from '../../src/match/helper/match-action-outcome.helper';
import { MatchPlayerSelectionHelper } from '../../src/match/helper/match-player-selection.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { TacticalSnapshot } from '../../src/match/interfaces/match-tactical-snapshot.interface';
import { TurnContext } from '../../src/match/interfaces/match-turn-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcomeIncidentType } from '../../src/match/model/match-action-outcome-incident-type.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function createPlayer(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p1',
    name: 'Player',
    position: 'FW',
    shirtNumber: 9,
    age: 27,
    skill: 80,
    attack: 82,
    defense: 55,
    energy: 78,
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
    teamLine: { attack: 80, defense: 75, midfield: 78 },
    opponentLine: { attack: 79, defense: 77, midfield: 77 },
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
    matchId: 'final_test',
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

function createOutcomeHelperHarness(): MatchActionOutcomeHelper {
  const helper: any = Object.create(MatchActionOutcomeHelper.prototype);
  helper['i18nService'] = { t: (key: string) => key };
  helper['matchNarrativeHelper'] = { describeZone: () => 'zone' };
  helper['matchDuelHelper'] = {
    resolveDuel: (params: { context: MatchCurrentContext }) => ({
      handled: false,
      success: false,
      fromPlayer: params.context.actingPlayer,
      toPlayer: params.context.actingPlayer,
      defenderPlayer: params.context.opponentsInZone[0] || params.context.actingPlayer,
      nextZone: params.context.zone,
      nextPossession: params.context.possession,
      wasSavedByGoalkeeper: false,
      outcome: 'NOT_HANDLED',
    }),
  };
  helper['matchProbabilityHelper'] = {
    resolveTeamGoalChance: () => false,
    resolveOpponentGoalChance: () => false,
    resolveCounterChance: () => false,
    resolvePostMissedShotPossession: () => MatchPossession.USER,
    resolveDefensiveRecoveryChance: () => true,
  };
  helper['matchGoalScorerHelper'] = {
    pickScorerForGoal: ({ fallbackPlayer }: { fallbackPlayer: TeamPlayer }) => fallbackPlayer,
  };
  helper['matchActionTransitionHelper'] = {
    resolveTransition: ({
      context,
      actionOutcome,
    }: {
      context: MatchCurrentContext;
      actionOutcome: string;
    }) => ({
      nextZone: context.zone,
      nextPossession:
        actionOutcome === 'DRIBBLE_LOST' ||
        actionOutcome === 'PASS_INTERCEPTED' ||
        actionOutcome === 'LONG_PASS_LOST'
          ? MatchPossession.OPPONENT
          : MatchPossession.USER,
      nextEventType:
        context.possession === MatchPossession.USER
          ? MatchEventType.BALL_POSSESSION_EVENT
          : MatchEventType.DEFENSE_EVENT,
      nextActingPlayer: context.actingPlayer,
    }),
  };
  helper['matchTurnOptionsHelper'] = {
    pickOpponentAction: () => MatchAction.ATTACK,
  };
  helper['matchPlayerSelectionHelper'] = new MatchPlayerSelectionHelper();
  helper['matchContextBuilderHelper'] = {
    getPlayersByZone: (players: TeamPlayer[]) => players,
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

function runAttackingRecoveryShouldPreferMfOrFw(): void {
  const helper = createOutcomeHelperHarness();
  const tactical = createTactical();

  const userPlayers = [
    createPlayer({ playerId: 'u_df', name: 'User DF', position: 'DF', defense: 90 }),
    createPlayer({ playerId: 'u_mf', name: 'User MF', position: 'MF', skill: 86 }),
    createPlayer({ playerId: 'u_fw', name: 'User FW', position: 'FW', attack: 88 }),
  ];
  const opponentPlayers = [
    createPlayer({ playerId: 'o_df', name: 'Opp DF', position: 'DF', defense: 87 }),
    createPlayer({ playerId: 'o_mf', name: 'Opp MF', position: 'MF', skill: 84 }),
    createPlayer({ playerId: 'o_fw', name: 'Opp FW', position: 'FW', attack: 86 }),
  ];

  const context: TurnContext = {
    action: MatchAction.PRESS,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.OPPONENT,
    zone: MatchFieldZone.ATTACK_THIRD,
    actingTeamId: 'por',
    actingTeamName: 'Portugal',
    actingPlayer: opponentPlayers[2],
  };

  const result = helper.resolveActionOutcome({
    match: createMatchStub(),
    context,
    currentContext: createCurrentContext(context, userPlayers, opponentPlayers, tactical),
    tactical,
    userPlayers,
    opponentPlayers,
    actionsByEvent: {} as any,
    baseUserPlayers: userPlayers,
    baseOpponentPlayers: opponentPlayers,
    isExecutingRegularPenalty: true,
  });

  const recoveredCarrier = userPlayers.find((player) => player.name === result.ballCarrierName);
  assert.ok(recoveredCarrier, 'Recovered carrier must belong to user roster.');
  assert.ok(
    recoveredCarrier?.position === 'MF' || recoveredCarrier?.position === 'FW',
    `When recovering high, carrier should be MF/FW. Got: ${recoveredCarrier?.position}`,
  );
}

function runDefendingRecoveryShouldPreferDf(): void {
  const helper = createOutcomeHelperHarness();
  const tactical = createTactical();

  const userPlayers = [
    createPlayer({ playerId: 'u_df', name: 'User DF', position: 'DF', defense: 90 }),
    createPlayer({ playerId: 'u_mf', name: 'User MF', position: 'MF', skill: 86 }),
    createPlayer({ playerId: 'u_fw', name: 'User FW', position: 'FW', attack: 88 }),
  ];
  const opponentPlayers = [
    createPlayer({ playerId: 'o_df', name: 'Opp DF', position: 'DF', defense: 87 }),
    createPlayer({ playerId: 'o_mf', name: 'Opp MF', position: 'MF', skill: 84 }),
    createPlayer({ playerId: 'o_fw', name: 'Opp FW', position: 'FW', attack: 86 }),
  ];

  const context: TurnContext = {
    action: MatchAction.TACKLE,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    possession: MatchPossession.OPPONENT,
    zone: MatchFieldZone.DEFENSE_THIRD,
    actingTeamId: 'por',
    actingTeamName: 'Portugal',
    actingPlayer: opponentPlayers[2],
  };

  const result = helper.resolveActionOutcome({
    match: createMatchStub(),
    context,
    currentContext: createCurrentContext(context, userPlayers, opponentPlayers, tactical),
    tactical,
    userPlayers,
    opponentPlayers,
    actionsByEvent: {} as any,
    baseUserPlayers: userPlayers,
    baseOpponentPlayers: opponentPlayers,
    isExecutingRegularPenalty: true,
  });

  const recoveredCarrier = userPlayers.find((player) => player.name === result.ballCarrierName);
  assert.ok(recoveredCarrier, 'Recovered carrier must belong to user roster.');
  assert.equal(
    recoveredCarrier?.position,
    'DF',
    `When recovering low, carrier should be DF. Got: ${recoveredCarrier?.position}`,
  );
}

function run(): void {
  runAttackingRecoveryShouldPreferMfOrFw();
  runDefendingRecoveryShouldPreferDf();
  console.log('OK - recovery role coherence checks passed.');
}

run();
