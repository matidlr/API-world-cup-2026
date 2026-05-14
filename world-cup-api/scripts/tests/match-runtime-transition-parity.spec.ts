import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';
import { MatchActionTransitionHelper } from '../../src/match/helper/match-action-transition.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { MatchActionOutcomeResult } from '../../src/match/interfaces/match-action-outcome.interface';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(id: string, name: string, position: TeamPlayer['position']): TeamPlayer {
  return {
    playerId: id,
    name,
    position,
    shirtNumber: 1,
    age: 27,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 90,
    isCaptain: false,
  };
}

function baseContext(params: {
  possession: MatchPossession;
  zone: MatchFieldZone;
  actingPlayer: TeamPlayer;
  teammatesInZone: TeamPlayer[];
  opponentsInZone: TeamPlayer[];
}): MatchCurrentContext {
  return {
    matchId: 'm-1',
    turn: 1,
    minute: 10,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    zone: params.zone,
    possession: params.possession,
    userTeamId: 'arg',
    userTeamName: 'Argentina',
    opponentTeamId: 'por',
    opponentTeamName: 'Portugal',
    actingTeamId: params.possession === MatchPossession.USER ? 'arg' : 'por',
    actingTeamName: params.possession === MatchPossession.USER ? 'Argentina' : 'Portugal',
    defendingTeamId: params.possession === MatchPossession.USER ? 'por' : 'arg',
    defendingTeamName: params.possession === MatchPossession.USER ? 'Portugal' : 'Argentina',
    actingPlayer: params.actingPlayer,
    teammatesInZone: params.teammatesInZone,
    opponentsInZone: params.opponentsInZone,
    actingOnFieldCount: 11,
    defendingOnFieldCount: 11,
    tacticalSnapshot: {
      teamStrategy: null,
      teamFormation: null,
      opponentStrategy: null,
      opponentFormation: null,
      teamPenaltyPoints: 0,
      opponentPenaltyPoints: 0,
      teamLine: { attack: 80, defense: 80, midfield: 80 },
      opponentLine: { attack: 80, defense: 80, midfield: 80 },
    },
    availableActions: [],
    isPendingSetPiece: false,
    isRivalryMatch: false,
  };
}

function buildOutcome(overrides: Partial<MatchActionOutcomeResult>): MatchActionOutcomeResult {
  return {
    scoreTeam: 0,
    scoreOpponent: 0,
    message: 'ok',
    isGoal: false,
    goalMessageKey: null,
    statTeamId: 'arg',
    statTeamName: 'Argentina',
    statPlayerName: 'User FW',
    statPlayerPosition: 'FW',
    statAction: MatchAction.PASS,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'User FW',
    actionOutcome: MatchActionOutcome.NOT_HANDLED,
    nextZone: MatchFieldZone.MIDFIELD,
    nextPossession: MatchPossession.USER,
    nextEventType: MatchEventType.BALL_POSSESSION_EVENT,
    actingPlayer: player('u-fw', 'User FW', 'FW'),
    incidents: [],
    ...overrides,
  };
}

function applyAndAssertScenario(params: {
  action: MatchAction;
  actionOutcome: MatchActionOutcome;
  context: MatchCurrentContext;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
}): void {
  const transitionHelper = new MatchActionTransitionHelper();
  const transition = transitionHelper.resolveTransition({
    context: params.context,
    action: params.action,
    actionOutcome: params.actionOutcome,
  });
  const pipeline = Object.create(MatchPlayTurnPipelineHelper.prototype) as any;
  pipeline.matchPlayerSelectionHelper = {
    pickPlayerForAction: (players: TeamPlayer[]) => players[0],
  };

  const nextCarrierPool =
    transition.nextPossession === MatchPossession.USER ? params.userPlayers : params.opponentPlayers;
  const nextCarrier = nextCarrierPool[0];
  const turnOutcome = buildOutcome({
    statAction: params.action,
    actionOutcome: params.actionOutcome,
    nextZone: transition.nextZone,
    nextPossession: transition.nextPossession,
    nextEventType: transition.nextEventType,
    ballCarrierTeamId: transition.nextPossession === MatchPossession.USER ? 'arg' : 'por',
    ballCarrierName: nextCarrier.name,
    actingPlayer: nextCarrier,
  });

  const match = {
    teamId: 'arg',
    opponentId: 'por',
    possessionTeam: MatchPossession.OPPONENT,
    currentZone: MatchFieldZone.DEFENSE_THIRD,
    eventType: MatchEventType.DEFENSE_EVENT,
    ballCarrierTeamId: 'por',
    ballCarrierName: 'Opp FW',
  } as any;

  pipeline['applyOutcomeTransition']({
    match,
    turnOutcome,
    userPlayers: params.userPlayers,
    baseUserPlayers: params.userPlayers,
    opponentPlayers: params.opponentPlayers,
    baseOpponentPlayers: params.opponentPlayers,
  });

  assert.equal(match.possessionTeam, turnOutcome.nextPossession);
  assert.equal(match.currentZone, turnOutcome.nextZone);
  assert.equal(match.eventType, turnOutcome.nextEventType);
  assert.equal(match.ballCarrierTeamId, turnOutcome.ballCarrierTeamId);
  assert.equal(match.ballCarrierName, turnOutcome.ballCarrierName);
}

function run(): void {
  const userPlayers = [player('u-fw', 'User FW', 'FW'), player('u-mf', 'User MF', 'MF')];
  const opponentPlayers = [player('o-fw', 'Opp FW', 'FW'), player('o-mf', 'Opp MF', 'MF')];

  applyAndAssertScenario({
    action: MatchAction.PASS,
    actionOutcome: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    context: baseContext({
      possession: MatchPossession.USER,
      zone: MatchFieldZone.MIDFIELD,
      actingPlayer: userPlayers[1],
      teammatesInZone: userPlayers,
      opponentsInZone: opponentPlayers,
    }),
    userPlayers,
    opponentPlayers,
  });

  applyAndAssertScenario({
    action: MatchAction.DRIBBLE,
    actionOutcome: MatchActionOutcome.DRIBBLE_LOST,
    context: baseContext({
      possession: MatchPossession.USER,
      zone: MatchFieldZone.ATTACK_THIRD,
      actingPlayer: userPlayers[0],
      teammatesInZone: userPlayers,
      opponentsInZone: opponentPlayers,
    }),
    userPlayers,
    opponentPlayers,
  });

  applyAndAssertScenario({
    action: MatchAction.SHOOT,
    actionOutcome: MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST,
    context: baseContext({
      possession: MatchPossession.USER,
      zone: MatchFieldZone.BOX,
      actingPlayer: userPlayers[0],
      teammatesInZone: userPlayers,
      opponentsInZone: opponentPlayers,
    }),
    userPlayers,
    opponentPlayers,
  });

  console.log('OK - runtime transition parity checks passed.');
}

run();
