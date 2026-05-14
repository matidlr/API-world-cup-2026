import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchActionTransitionHelper } from '../../src/match/helper/match-action-transition.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(id: string, name: string, position: TeamPlayer['position']): TeamPlayer {
  return {
    playerId: id,
    name,
    position,
    shirtNumber: 1,
    age: 26,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 80,
    isCaptain: false,
  };
}

function createContext(overrides: Partial<MatchCurrentContext> = {}): MatchCurrentContext {
  const userCarrier = player('u1', 'User 1', 'MF');
  const userSupport = player('u2', 'User 2', 'FW');
  const oppCarrier = player('o1', 'Opp 1', 'MF');
  const oppSupport = player('o2', 'Opp 2', 'DF');

  return {
    matchId: 'm1',
    turn: 2,
    minute: 20,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    zone: MatchFieldZone.MIDFIELD,
    possession: MatchPossession.USER,
    userTeamId: 'arg',
    userTeamName: 'Argentina',
    opponentTeamId: 'por',
    opponentTeamName: 'Portugal',
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    defendingTeamId: 'por',
    defendingTeamName: 'Portugal',
    actingPlayer: userCarrier,
    teammatesInZone: [userCarrier, userSupport],
    opponentsInZone: [oppCarrier, oppSupport],
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
    availableActions: [MatchAction.PASS, MatchAction.DRIBBLE, MatchAction.SHOOT],
    isPendingSetPiece: false,
    isRivalryMatch: false,
    ...overrides,
  };
}

function run(): void {
  const helper = new MatchActionTransitionHelper();

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.DEFENSE_THIRD }),
      action: MatchAction.PASS,
      actionOutcome: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    });
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
    assert.equal(result.nextEventType, MatchEventType.BALL_POSSESSION_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.MIDFIELD }),
      action: MatchAction.PASS,
      actionOutcome: MatchActionOutcome.PASS_INTERCEPTED,
    });
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
    assert.equal(result.nextEventType, MatchEventType.DEFENSE_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.MIDFIELD }),
      action: MatchAction.LONG_PASS,
      actionOutcome: MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS,
    });
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextZone, MatchFieldZone.BOX);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.ATTACK_THIRD }),
      action: MatchAction.DRIBBLE,
      actionOutcome: MatchActionOutcome.DRIBBLE_WON,
    });
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextZone, MatchFieldZone.BOX);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.BOX, possession: MatchPossession.USER }),
      action: MatchAction.SHOOT,
      actionOutcome: MatchActionOutcome.SHOOT_USER_GOAL,
    });
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextEventType, MatchEventType.KICKOFF_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.BOX, possession: MatchPossession.OPPONENT }),
      action: MatchAction.SHOOT,
      actionOutcome: MatchActionOutcome.SHOOT_OPPONENT_GOAL,
    });
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextEventType, MatchEventType.KICKOFF_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({ zone: MatchFieldZone.BOX, possession: MatchPossession.USER }),
      action: MatchAction.SHOOT,
      actionOutcome: MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST,
    });
    assert.equal(result.nextZone, MatchFieldZone.BOX);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextEventType, MatchEventType.DEFENSE_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({
        eventType: MatchEventType.FREE_KICK_FOR_EVENT,
        possession: MatchPossession.USER,
        zone: MatchFieldZone.ATTACK_THIRD,
      }),
      action: MatchAction.PASS,
      actionOutcome: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    });
    assert.equal(result.nextEventType, MatchEventType.BALL_POSSESSION_EVENT);
    assert.equal(result.nextPossession, MatchPossession.USER);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({
        possession: MatchPossession.OPPONENT,
        eventType: MatchEventType.DEFENSE_EVENT,
      }),
      action: MatchAction.PRESS,
      actionOutcome: MatchActionOutcome.PRESS_WON,
    });
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextEventType, MatchEventType.BALL_POSSESSION_EVENT);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({
        possession: MatchPossession.USER,
        zone: MatchFieldZone.MIDFIELD,
      }),
      action: MatchAction.ATTACK,
      actionOutcome: MatchActionOutcome.ATTACK_PROGRESS,
    });
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextZone, MatchFieldZone.ATTACK_THIRD);
  }

  {
    const result = helper.resolveTransition({
      context: createContext({
        possession: MatchPossession.USER,
        zone: MatchFieldZone.ATTACK_THIRD,
      }),
      action: MatchAction.CROSS,
      actionOutcome: MatchActionOutcome.CROSS_CLEARED,
    });
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
  }

  console.log('OK - action transition matrix passed.');
}

run();
