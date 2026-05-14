import { Injectable } from '@nestjs/common';
import {
  MatchActionTransitionHelperContract,
  MatchActionTransitionResult,
  ResolveMatchActionTransitionParams,
} from '../interfaces/match-action-transition.interface';
import { MatchAction } from '../model/match-action.enum';
import { DEFENSIVE_ACTIONS } from '../model/match-action-group.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

const ZONE_ORDER: MatchFieldZone[] = [
  MatchFieldZone.DEFENSE_THIRD,
  MatchFieldZone.MIDFIELD,
  MatchFieldZone.ATTACK_THIRD,
  MatchFieldZone.BOX,
];

const SET_PIECE_EVENT_TYPES = new Set<MatchEventType>([
  MatchEventType.PENALTY_FOR_EVENT,
  MatchEventType.PENALTY_AGAINST_EVENT,
  MatchEventType.FREE_KICK_FOR_EVENT,
  MatchEventType.FREE_KICK_AGAINST_EVENT,
  MatchEventType.CORNER_FOR_EVENT,
  MatchEventType.CORNER_AGAINST_EVENT,
  MatchEventType.THROW_IN_FOR_EVENT,
  MatchEventType.THROW_IN_AGAINST_EVENT,
]);

@Injectable()
/**
 * Pure transition matrix:
 * action + outcome + current context => next zone/possession/event.
 *
 * Important: probabilistic decisions (duel/goal/card/etc.) are resolved elsewhere.
 */
export class MatchActionTransitionHelper
  extends AbstractMatchBasicHelper
  implements MatchActionTransitionHelperContract
{
  resolveTransition(params: ResolveMatchActionTransitionParams): MatchActionTransitionResult {
    const { context, action, actionOutcome } = params;

    if (
      actionOutcome === MatchActionOutcome.SHOOT_USER_GOAL ||
      actionOutcome === MatchActionOutcome.SHOOT_OPPONENT_GOAL
    ) {
      const nextPossession = this.flipPossession(context.possession);
      return {
        nextZone: MatchFieldZone.MIDFIELD,
        nextPossession,
        nextEventType: MatchEventType.KICKOFF_EVENT,
        nextActingPlayer: this.resolveNextActingPlayer(context, nextPossession),
      };
    }

    const nextState = this.resolveNextState(context, action, actionOutcome);

    return {
      ...nextState,
      nextEventType: this.resolveNextEventType(context.eventType, nextState.nextPossession),
      nextActingPlayer: this.resolveNextActingPlayer(context, nextState.nextPossession),
    };
  }

  private resolveNextState(
    context: ResolveMatchActionTransitionParams['context'],
    action: MatchAction,
    actionOutcome: MatchActionOutcome,
  ): Pick<MatchActionTransitionResult, 'nextZone' | 'nextPossession'> {
    switch (actionOutcome) {
      case MatchActionOutcome.PASS_SUCCESS_PROGRESS:
        return {
          nextZone: this.advanceZoneForPass(context.zone),
          nextPossession: context.possession,
        };
      case MatchActionOutcome.PASS_INTERCEPTED:
        return {
          nextZone: this.resolveTurnoverZone(context.zone),
          nextPossession: this.flipPossession(context.possession),
        };
      case MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS:
        return {
          nextZone: this.advanceZoneForLongPass(context.zone),
          nextPossession: context.possession,
        };
      case MatchActionOutcome.LONG_PASS_LOST:
        return {
          nextZone: this.resolveTurnoverZone(context.zone),
          nextPossession: this.flipPossession(context.possession),
        };
      case MatchActionOutcome.DRIBBLE_WON:
        return {
          nextZone: this.advanceOneZone(context.zone),
          nextPossession: context.possession,
        };
      case MatchActionOutcome.DRIBBLE_LOST:
        return {
          nextZone: this.resolveTurnoverZone(context.zone),
          nextPossession: this.flipPossession(context.possession),
        };
      case MatchActionOutcome.PRESS_WON:
      case MatchActionOutcome.TACKLE_WON:
      case MatchActionOutcome.DEFEND_HOLD:
        return {
          nextZone: context.zone,
          nextPossession: MatchPossession.USER,
        };
      case MatchActionOutcome.PRESS_LOST:
      case MatchActionOutcome.TACKLE_LOST:
      case MatchActionOutcome.DEFEND_BROKEN:
        return {
          nextZone: context.zone,
          nextPossession: MatchPossession.OPPONENT,
        };
      case MatchActionOutcome.ATTACK_PROGRESS:
        return {
          nextZone: this.advanceOneZone(context.zone),
          nextPossession: MatchPossession.USER,
        };
      case MatchActionOutcome.ATTACK_STALLED:
        return {
          nextZone: context.zone,
          nextPossession: MatchPossession.USER,
        };
      case MatchActionOutcome.HOLD_STABLE:
        return {
          nextZone: context.zone,
          nextPossession: MatchPossession.USER,
        };
      case MatchActionOutcome.HOLD_LOST:
        return {
          nextZone: context.zone,
          nextPossession: MatchPossession.OPPONENT,
        };
      case MatchActionOutcome.CROSS_CONNECTED:
        return {
          nextZone: MatchFieldZone.BOX,
          nextPossession: MatchPossession.USER,
        };
      case MatchActionOutcome.CROSS_CLEARED:
        return {
          nextZone: this.resolveTurnoverZone(context.zone),
          nextPossession: MatchPossession.OPPONENT,
        };
      case MatchActionOutcome.SHOOT_BLOCKED_REBOUND_FOR:
      case MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR:
        return {
          nextZone: context.zone,
          nextPossession: context.possession,
        };
      case MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST:
      case MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST:
      case MatchActionOutcome.SHOOT_MISSED:
        return {
          nextZone: context.zone,
          nextPossession: this.flipPossession(context.possession),
        };
      default:
        return this.resolveDefaultByAction(context, action);
    }
  }

  private resolveDefaultByAction(
    context: ResolveMatchActionTransitionParams['context'],
    action: MatchAction,
  ): Pick<MatchActionTransitionResult, 'nextZone' | 'nextPossession'> {
    if (!DEFENSIVE_ACTIONS.has(action)) {
      return {
        nextZone: context.zone,
        nextPossession: context.possession,
      };
    }

    if (context.possession === MatchPossession.OPPONENT) {
      return {
        nextZone: context.zone,
        nextPossession: MatchPossession.OPPONENT,
      };
    }

    return {
      nextZone: context.zone,
      nextPossession: MatchPossession.USER,
    };
  }

  private resolveNextEventType(eventType: MatchEventType, possession: MatchPossession): MatchEventType {
    if (eventType === MatchEventType.FORFEIT_EVENT || eventType === MatchEventType.END) {
      return eventType;
    }

    if (SET_PIECE_EVENT_TYPES.has(eventType)) {
      return possession === MatchPossession.USER
        ? MatchEventType.BALL_POSSESSION_EVENT
        : MatchEventType.DEFENSE_EVENT;
    }

    if (eventType === MatchEventType.KICKOFF_EVENT) {
      return MatchEventType.BALL_POSSESSION_EVENT;
    }

    return possession === MatchPossession.USER
      ? MatchEventType.BALL_POSSESSION_EVENT
      : MatchEventType.DEFENSE_EVENT;
  }

  private resolveNextActingPlayer(
    context: ResolveMatchActionTransitionParams['context'],
    nextPossession: MatchPossession,
  ) {
    const candidates = this.resolveCandidatesForNextPossession(context, nextPossession);
    return candidates[0] || context.actingPlayer;
  }

  private resolveCandidatesForNextPossession(
    context: ResolveMatchActionTransitionParams['context'],
    nextPossession: MatchPossession,
  ) {
    if (context.possession === nextPossession) {
      return context.teammatesInZone;
    }

    return context.opponentsInZone;
  }

  private advanceZoneForPass(zone: MatchFieldZone): MatchFieldZone {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return MatchFieldZone.MIDFIELD;
      case MatchFieldZone.MIDFIELD:
        return MatchFieldZone.ATTACK_THIRD;
      case MatchFieldZone.ATTACK_THIRD:
      case MatchFieldZone.BOX:
        return MatchFieldZone.BOX;
      default:
        return MatchFieldZone.MIDFIELD;
    }
  }

  private advanceZoneForLongPass(zone: MatchFieldZone): MatchFieldZone {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return MatchFieldZone.ATTACK_THIRD;
      case MatchFieldZone.MIDFIELD:
      case MatchFieldZone.ATTACK_THIRD:
      case MatchFieldZone.BOX:
        return MatchFieldZone.BOX;
      default:
        return MatchFieldZone.ATTACK_THIRD;
    }
  }

  private advanceOneZone(zone: MatchFieldZone): MatchFieldZone {
    const zoneIndex = ZONE_ORDER.indexOf(zone);
    const safeIndex = zoneIndex < 0 ? 1 : zoneIndex;
    const nextIndex = Math.min(safeIndex + 1, ZONE_ORDER.length - 1);
    return ZONE_ORDER[nextIndex];
  }

  private resolveTurnoverZone(zone: MatchFieldZone): MatchFieldZone {
    switch (zone) {
      case MatchFieldZone.BOX:
        return MatchFieldZone.ATTACK_THIRD;
      case MatchFieldZone.ATTACK_THIRD:
        return MatchFieldZone.MIDFIELD;
      case MatchFieldZone.MIDFIELD:
      case MatchFieldZone.DEFENSE_THIRD:
      default:
        return MatchFieldZone.MIDFIELD;
    }
  }

  private flipPossession(possession: MatchPossession): MatchPossession {
    return possession === MatchPossession.USER ? MatchPossession.OPPONENT : MatchPossession.USER;
  }
}
