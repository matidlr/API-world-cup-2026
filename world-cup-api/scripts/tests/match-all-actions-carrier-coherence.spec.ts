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

function createOutcomeHelperHarness(): MatchActionOutcomeHelper {
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
      nextZone: context.zone,
      nextPossession: context.possession,
      nextEventType:
        context.possession === MatchPossession.USER
          ? MatchEventType.BALL_POSSESSION_EVENT
          : MatchEventType.DEFENSE_EVENT,
      nextActingPlayer: context.actingPlayer,
    }),
  };
  helper['matchTurnOrchestratorHelper'] = {
    resolveOpenPlayRestartDescriptor: () => ({
      action: MatchAction.PASS,
      zone: MatchFieldZone.MIDFIELD,
      messageKey: 'match.restart.freeKick',
    }),
  };
  helper['matchOpenPlayRestartHelper'] = {
    resolveOpenPlayRestartEvent: () => null,
    resolvePossessionFromRestartEvent: () => MatchPossession.USER,
  };
  helper['matchDuelHelper'] = {
    resolveDuel: ({ context, action }: { context: MatchCurrentContext; action: MatchAction }) => {
      const duelActions = new Set<MatchAction>([
        MatchAction.PASS,
        MatchAction.LONG_PASS,
        MatchAction.DRIBBLE,
        MatchAction.SHOOT,
      ]);

      if (!duelActions.has(action)) {
        return {
          handled: false,
          outcome: MatchActionOutcome.NOT_HANDLED,
          success: false,
          fromPlayer: context.actingPlayer,
          toPlayer: context.actingPlayer,
          defenderPlayer: context.opponentsInZone[0] || context.actingPlayer,
          nextZone: context.zone,
          nextPossession: context.possession,
          wasSavedByGoalkeeper: false,
        };
      }

      const toPlayer =
        context.possession === MatchPossession.USER
          ? context.teammatesInZone[0] || context.actingPlayer
          : context.opponentsInZone[0] || context.actingPlayer;

      return {
        handled: true,
        outcome:
          action === MatchAction.PASS
            ? MatchActionOutcome.PASS_SUCCESS_PROGRESS
            : action === MatchAction.LONG_PASS
              ? MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS
              : action === MatchAction.DRIBBLE
                ? MatchActionOutcome.DRIBBLE_WON
                : MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR,
        success: true,
        fromPlayer: context.actingPlayer,
        toPlayer,
        defenderPlayer: context.opponentsInZone[0] || context.actingPlayer,
        nextZone: context.zone,
        nextPossession: context.possession,
        wasSavedByGoalkeeper: false,
      };
    },
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

function eventTypeByAction(action: MatchAction): MatchEventType {
  switch (action) {
    case MatchAction.LEFT:
    case MatchAction.RIGHT:
    case MatchAction.CENTER:
    case MatchAction.PICAR:
      return MatchEventType.PENALTY_FOR_EVENT;
    case MatchAction.DIVE_LEFT:
    case MatchAction.DIVE_RIGHT:
    case MatchAction.STAY_CENTER:
    case MatchAction.WAIT:
      return MatchEventType.PENALTY_AGAINST_EVENT;
    default:
      return MatchEventType.BALL_POSSESSION_EVENT;
  }
}

function possessionByAction(action: MatchAction): MatchPossession {
  switch (action) {
    case MatchAction.DIVE_LEFT:
    case MatchAction.DIVE_RIGHT:
    case MatchAction.STAY_CENTER:
    case MatchAction.WAIT:
      return MatchPossession.OPPONENT;
    default:
      return MatchPossession.USER;
  }
}

function run(): void {
  const helper = createOutcomeHelperHarness();
  const userActionValues = Object.values(MatchAction).filter(
    (action) => action !== MatchAction.RESTART_MATCH && action !== MatchAction.QUIT_MATCH,
  );
  const duelActionSet = new Set<MatchAction>([
    MatchAction.PASS,
    MatchAction.LONG_PASS,
    MatchAction.DRIBBLE,
    MatchAction.SHOOT,
  ]);

  for (const action of userActionValues) {
    const eventType = eventTypeByAction(action);
    const possession = possessionByAction(action);
    const actingPlayer = createPlayer({ playerId: 'actor', name: `Actor-${action}` });
    const userPlayers = [actingPlayer, createPlayer({ playerId: 'u2', name: 'User 2', position: 'FW' })];
    const opponentPlayers = [
      createPlayer({ playerId: 'o1', name: 'Opp 1', position: 'DF' }),
      createPlayer({ playerId: 'o2', name: 'Opp 2', position: 'MF' }),
    ];

    const turnContext: TurnContext = {
      action,
      eventType,
      possession,
      zone: MatchFieldZone.MIDFIELD,
      actingTeamId: possession === MatchPossession.USER ? 'arg' : 'por',
      actingTeamName: possession === MatchPossession.USER ? 'Argentina' : 'Portugal',
      actingPlayer,
    };

    const currentContext = createCurrentContext(
      turnContext,
      userPlayers,
      opponentPlayers,
      createTactical(),
    );

    const result = helper.resolveActionOutcome({
      match: createMatchStub(),
      context: turnContext,
      currentContext,
      tactical: createTactical(),
      userPlayers,
      opponentPlayers,
      actionsByEvent: {} as any,
      baseUserPlayers: userPlayers,
      baseOpponentPlayers: opponentPlayers,
      isExecutingRegularPenalty: true,
    });

    assert.equal(Boolean(result.ballCarrierName), true, `ballCarrierName missing for ${action}`);
    assert.equal(
      result.ballCarrierTeamId,
      result.nextPossession === MatchPossession.USER ? 'arg' : 'por',
      `carrier team mismatch for ${action}`,
    );

    if (duelActionSet.has(action)) {
      const expectedCarrier =
        possession === MatchPossession.USER ? currentContext.teammatesInZone[0] : currentContext.opponentsInZone[0];
      assert.equal(
        result.ballCarrierName,
        expectedCarrier.name,
        `duel carrier mismatch for ${action}`,
      );
    }
  }

  console.log('OK - all action carrier coherence checks passed.');
}

run();
