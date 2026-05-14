import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchDuelHelper } from '../../src/match/helper/match-duel.helper';
import { MatchActionTransitionHelper } from '../../src/match/helper/match-action-transition.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(id: string, name: string, position: 'GK' | 'DF' | 'MF' | 'FW'): TeamPlayer {
  return {
    playerId: id,
    name,
    position,
    shirtNumber: 1,
    age: 27,
    skill: 80,
    attack: position === 'FW' ? 88 : 72,
    defense: position === 'DF' || position === 'GK' ? 86 : 65,
    energy: 80,
    isCaptain: false,
  };
}

function context(
  overrides: Partial<MatchCurrentContext> = {},
): MatchCurrentContext {
  const actingPlayer = player('u1', 'User Mid', 'MF');
  return {
    matchId: 'm1',
    turn: 3,
    minute: 27,
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
    actingPlayer,
    teammatesInZone: [actingPlayer, player('u2', 'User Fwd', 'FW')],
    opponentsInZone: [player('o1', 'Opp Def', 'DF'), player('o2', 'Opp GK', 'GK')],
    actingOnFieldCount: 11,
    defendingOnFieldCount: 11,
    tacticalSnapshot: {
      teamStrategy: null,
      teamFormation: null,
      opponentStrategy: null,
      opponentFormation: null,
      teamPenaltyPoints: 0,
      opponentPenaltyPoints: 0,
      teamLine: { attack: 80, defense: 78, midfield: 79 },
      opponentLine: { attack: 79, defense: 80, midfield: 78 },
    },
    availableActions: [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.DRIBBLE, MatchAction.SHOOT],
    isPendingSetPiece: false,
    isRivalryMatch: false,
    ...overrides,
  };
}

function withRandomSequence(sequence: number[], block: () => void): void {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = sequence[index];
    index += 1;
    if (value === undefined) {
      return 0.5;
    }
    return value;
  };

  try {
    block();
  } finally {
    Math.random = originalRandom;
  }
}

function run(): void {
  const helper = new MatchDuelHelper(new MatchActionTransitionHelper());

  // PASS success from midfield should keep possession and progress zone.
  withRandomSequence([0.1, 0.1, 0.1], () => {
    const result = helper.resolveDuel({
      context: context({ zone: MatchFieldZone.MIDFIELD }),
      action: MatchAction.PASS,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, true);
    assert.equal(result.outcome, MatchActionOutcome.PASS_SUCCESS_PROGRESS);
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.nextZone, MatchFieldZone.ATTACK_THIRD);
    assert.equal(result.toPlayer.playerId !== result.fromPlayer.playerId, true);
  });

  // PASS intercepted from midfield should lose possession.
  withRandomSequence([0.95, 0.95, 0.95], () => {
    const result = helper.resolveDuel({
      context: context({ zone: MatchFieldZone.MIDFIELD }),
      action: MatchAction.PASS,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.outcome, MatchActionOutcome.PASS_INTERCEPTED);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
  });

  // DRIBBLE lost in attack third should hand ball to rival and move zone back.
  withRandomSequence([0.99, 0.99], () => {
    const result = helper.resolveDuel({
      context: context({ zone: MatchFieldZone.ATTACK_THIRD }),
      action: MatchAction.DRIBBLE,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.outcome, MatchActionOutcome.DRIBBLE_LOST);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(result.nextZone, MatchFieldZone.MIDFIELD);
  });

  // SHOOT miss with rebound for acting team.
  withRandomSequence([0.1, 0.1, 0.1, 0.1], () => {
    const result = helper.resolveDuel({
      context: context({
        zone: MatchFieldZone.BOX,
        teammatesInZone: [player('u9', 'Shooter', 'FW')],
        actingPlayer: player('u9', 'Shooter', 'FW'),
        opponentsInZone: [player('gk1', 'Keeper', 'GK')],
      }),
      action: MatchAction.SHOOT,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.nextPossession, MatchPossession.USER);
    assert.equal(result.outcome, MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR);
  });

  // SHOOT miss with rebound for defending team.
  withRandomSequence([0.2, 0.2, 0.99, 0.99], () => {
    const result = helper.resolveDuel({
      context: context({
        zone: MatchFieldZone.BOX,
        teammatesInZone: [player('u9', 'Shooter', 'FW')],
        actingPlayer: player('u9', 'Shooter', 'FW'),
        opponentsInZone: [player('gk1', 'Keeper', 'GK'), player('d1', 'Marker', 'DF')],
      }),
      action: MatchAction.SHOOT,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
    assert.equal(
      result.outcome === MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST ||
        result.outcome === MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST,
      true,
    );
  });

  // SHOOT blocked with rebound for defending team (forced DF branch: no goalkeeper in zone).
  withRandomSequence([0.2, 0.2, 0.99], () => {
    const result = helper.resolveDuel({
      context: context({
        zone: MatchFieldZone.BOX,
        teammatesInZone: [player('u9', 'Shooter', 'FW')],
        actingPlayer: player('u9', 'Shooter', 'FW'),
        opponentsInZone: [player('d1', 'Marker', 'DF')],
      }),
      action: MatchAction.SHOOT,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.outcome, MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
  });

  // SHOOT off target should resolve explicit SHOOT_MISSED.
  withRandomSequence([0.1, 0.95], () => {
    const result = helper.resolveDuel({
      context: context({
        zone: MatchFieldZone.BOX,
        teammatesInZone: [player('u9', 'Shooter', 'FW')],
        actingPlayer: player('u9', 'Shooter', 'FW'),
        opponentsInZone: [player('gk1', 'Keeper', 'GK')],
      }),
      action: MatchAction.SHOOT,
    });
    assert.equal(result.handled, true);
    assert.equal(result.success, false);
    assert.equal(result.outcome, MatchActionOutcome.SHOOT_MISSED);
    assert.equal(result.nextPossession, MatchPossession.OPPONENT);
  });

  console.log('OK - duel helper battery passed.');
}

run();
