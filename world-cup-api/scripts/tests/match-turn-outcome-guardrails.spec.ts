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

function createServiceHarness(stubs: {
  teamGoal: boolean;
  opponentGoal: boolean;
  reboundPossession: MatchPossession;
}) {
  let opponentGoalCalls = 0;

  const helper = Object.create(MatchActionOutcomeHelper.prototype) as any;
  helper['i18nService'] = {
    t: (key: string) => key,
  };
  helper['matchNarrativeHelper'] = {
    describeZone: () => 'box',
  };
  helper['matchProbabilityHelper'] = {
    resolveTeamGoalChance: () => stubs.teamGoal,
    resolveOpponentGoalChance: () => {
      opponentGoalCalls += 1;
      return stubs.opponentGoal;
    },
    resolveCounterChance: () => false,
    resolvePostMissedShotPossession: () => stubs.reboundPossession,
  };
  helper['matchTurnOptionsHelper'] = {
    pickOpponentAction: () => MatchAction.SHOOT,
  };
  helper['matchPlayerSelectionHelper'] = {
    pickPlayerForAction: () =>
      createPlayer({ playerId: 'opp1', name: 'Opponent FW', position: 'FW' }),
  };
  helper['matchGoalScorerHelper'] = {
    pickScorerForGoal: ({ fallbackPlayer }: { fallbackPlayer: TeamPlayer }) => fallbackPlayer,
  };
  helper['matchActionTransitionHelper'] = {
    resolveTransition: ({
      context,
      action,
      actionOutcome,
    }: {
      context: MatchCurrentContext;
      action: MatchAction;
      actionOutcome: MatchActionOutcome;
    }) => ({
      nextZone: context.zone,
      nextPossession:
        actionOutcome === MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST ||
        actionOutcome === MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST ||
        actionOutcome === MatchActionOutcome.SHOOT_MISSED ||
        actionOutcome === MatchActionOutcome.DRIBBLE_LOST ||
        actionOutcome === MatchActionOutcome.PASS_INTERCEPTED ||
        actionOutcome === MatchActionOutcome.LONG_PASS_LOST
          ? MatchPossession.OPPONENT
          : MatchPossession.USER,
      nextEventType:
        action === MatchAction.SHOOT &&
        (actionOutcome === MatchActionOutcome.SHOOT_USER_GOAL ||
          actionOutcome === MatchActionOutcome.SHOOT_OPPONENT_GOAL)
          ? MatchEventType.KICKOFF_EVENT
          : context.possession === MatchPossession.USER
            ? MatchEventType.BALL_POSSESSION_EVENT
            : MatchEventType.DEFENSE_EVENT,
      nextActingPlayer: context.actingPlayer,
    }),
  };
  helper['matchDuelHelper'] = {
    resolveDuel: ({ context, action }: { context: MatchCurrentContext; action: MatchAction }) => {
      if (
        action === MatchAction.PASS ||
        action === MatchAction.LONG_PASS ||
        action === MatchAction.DRIBBLE ||
        action === MatchAction.SHOOT
      ) {
        const nextPossession =
          action === MatchAction.SHOOT
            ? stubs.reboundPossession
            : context.possession;
        const toPlayer =
          nextPossession === MatchPossession.USER
            ? context.actingPlayer
            : (context.opponentsInZone[0] || context.actingPlayer);
        const nextZoneByAction: Partial<Record<MatchAction, MatchFieldZone>> = {
          [MatchAction.PASS]: MatchFieldZone.ATTACK_THIRD,
          [MatchAction.LONG_PASS]: MatchFieldZone.BOX,
          [MatchAction.DRIBBLE]: MatchFieldZone.BOX,
          [MatchAction.SHOOT]: context.zone,
        };
        const outcomeByAction: Partial<Record<MatchAction, MatchActionOutcome>> = {
          [MatchAction.PASS]: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
          [MatchAction.LONG_PASS]: MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS,
          [MatchAction.DRIBBLE]: MatchActionOutcome.DRIBBLE_WON,
          [MatchAction.SHOOT]:
            nextPossession === MatchPossession.USER
              ? MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR
              : MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST,
        };

        return {
          handled: true,
          outcome: outcomeByAction[action] || MatchActionOutcome.NOT_HANDLED,
          success: action !== MatchAction.SHOOT,
          fromPlayer: context.actingPlayer,
          toPlayer,
          defenderPlayer: context.opponentsInZone[0] || context.actingPlayer,
          nextZone: nextZoneByAction[action] || context.zone,
          nextPossession,
          wasSavedByGoalkeeper: action === MatchAction.SHOOT,
        };
      }

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
    },
  };
  helper['matchContextBuilderHelper'] = {
    getPlayersByZone: (players: TeamPlayer[]) => players,
  };
  helper['matchOpenPlayRestartHelper'] = {
    resolveOpenPlayRestartIncident: () => null,
    resolvePossessionFromRestartEvent: () => MatchPossession.USER,
    resolveOpenPlayRestartEvent: () => null,
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

  return {
    helper,
    getOpponentGoalCalls: () => opponentGoalCalls,
  };
}

function run(): void {
  const userPlayer = createPlayer({ playerId: 'u1', name: 'User FW', position: 'FW' });
  const opponentPlayer = createPlayer({ playerId: 'o1', name: 'Opp DF', position: 'DF', defense: 84 });
  const userPlayers = [userPlayer];
  const opponentPlayers = [opponentPlayer];
  const tactical = createTactical();

  // 1) Missed SHOOT should resolve rebound possession (never instant opponent goal in same turn).
  {
    const { helper, getOpponentGoalCalls } = createServiceHarness({
      teamGoal: false,
      opponentGoal: true,
      reboundPossession: MatchPossession.OPPONENT,
    });
    const context: TurnContext = {
      action: MatchAction.SHOOT,
      eventType: MatchEventType.BALL_POSSESSION_EVENT,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.BOX,
      actingTeamId: 'arg',
      actingTeamName: 'Argentina',
      actingPlayer: userPlayer,
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

    assert.equal(result.isGoal, false, 'Missed SHOOT must not produce instant opponent goal');
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextZone, MatchFieldZone.BOX);
    assert.equal(result.ballCarrierTeamId, 'por');
    assert.equal(getOpponentGoalCalls(), 0, 'Opponent direct goal check should be skipped for missed SHOOT');
  }

  // 2) Defensive action with USER possession should not allow instant opponent goal branch.
  {
    const { helper, getOpponentGoalCalls } = createServiceHarness({
      teamGoal: false,
      opponentGoal: true,
      reboundPossession: MatchPossession.USER,
    });
    const context: TurnContext = {
      action: MatchAction.TACKLE,
      eventType: MatchEventType.BALL_POSSESSION_EVENT,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.MIDFIELD,
      actingTeamId: 'arg',
      actingTeamName: 'Argentina',
      actingPlayer: userPlayer,
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

    assert.equal(result.isGoal, false, 'TACKLE should not trigger instant opponent goal');
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(getOpponentGoalCalls(), 0, 'Opponent direct goal check should be skipped for defensive action');
  }

  // 3) LONG_PASS now resolves through duel flow and should not jump directly to opponent goal branch.
  {
    const { helper, getOpponentGoalCalls } = createServiceHarness({
      teamGoal: false,
      opponentGoal: true,
      reboundPossession: MatchPossession.USER,
    });
    const context: TurnContext = {
      action: MatchAction.LONG_PASS,
      eventType: MatchEventType.ATTACK_EVENT,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.ATTACK_THIRD,
      actingTeamId: 'arg',
      actingTeamName: 'Argentina',
      actingPlayer: userPlayer,
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

    assert.equal(result.isGoal, false, 'LONG_PASS should resolve as duel outcome without instant opponent goal');
    assert.equal(result.statTeamId, 'arg');
    assert.equal(result.nextZone, MatchFieldZone.BOX);
    assert.equal(getOpponentGoalCalls(), 0, 'Opponent direct goal check should not run for duel-handled LONG_PASS');
  }

  console.log('OK - turn outcome guardrails passed.');
}

run();
