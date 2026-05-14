import { Injectable } from '@nestjs/common';
import { MatchOpenPlayRestartHelperContract } from '../interfaces/match-open-play-restart.interface';
import { TurnContext } from '../interfaces/match-turn-context.interface';
import { MatchAction } from '../model/match-action.enum';
import { DEFENSIVE_ACTIONS } from '../model/match-action-group.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
export class MatchOpenPlayRestartHelper
  extends AbstractMatchBasicHelper
  implements MatchOpenPlayRestartHelperContract
{
  resolveOpenPlayRestartEvent(context: TurnContext, isGoal: boolean): MatchEventType | null {
    if (isGoal) {
      return null;
    }

    switch (context.eventType) {
      case MatchEventType.PENALTY_FOR_EVENT:
      case MatchEventType.PENALTY_AGAINST_EVENT:
      case MatchEventType.FREE_KICK_FOR_EVENT:
      case MatchEventType.FREE_KICK_AGAINST_EVENT:
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.CORNER_AGAINST_EVENT:
      case MatchEventType.THROW_IN_FOR_EVENT:
      case MatchEventType.THROW_IN_AGAINST_EVENT:
        return null;
      default:
        break;
    }

    const restartRoll = this.random();
    const penaltyRoll = this.random();
    const isAttackingAction =
      context.action === MatchAction.SHOOT ||
      context.action === MatchAction.CROSS ||
      context.action === MatchAction.ATTACK ||
      context.action === MatchAction.DRIBBLE;
    const isBuildUpAction =
      context.action === MatchAction.PASS ||
      context.action === MatchAction.LONG_PASS ||
      context.action === MatchAction.HOLD;

    if (context.zone === MatchFieldZone.BOX) {
      if (context.possession === MatchPossession.USER && isAttackingAction && penaltyRoll < 0.08) {
        return MatchEventType.PENALTY_FOR_EVENT;
      }

      if (
        context.possession === MatchPossession.OPPONENT &&
        DEFENSIVE_ACTIONS.has(context.action) &&
        penaltyRoll < 0.1
      ) {
        return MatchEventType.PENALTY_AGAINST_EVENT;
      }
    }

    if (
      (context.zone === MatchFieldZone.BOX || context.zone === MatchFieldZone.ATTACK_THIRD) &&
      isAttackingAction
    ) {
      if (restartRoll < 0.26) {
        return context.possession === MatchPossession.USER
          ? MatchEventType.CORNER_FOR_EVENT
          : MatchEventType.CORNER_AGAINST_EVENT;
      }
    }

    if (
      (context.zone === MatchFieldZone.MIDFIELD || context.zone === MatchFieldZone.DEFENSE_THIRD) &&
      (isBuildUpAction || DEFENSIVE_ACTIONS.has(context.action))
    ) {
      if (restartRoll < 0.2) {
        return context.possession === MatchPossession.USER
          ? MatchEventType.THROW_IN_FOR_EVENT
          : MatchEventType.THROW_IN_AGAINST_EVENT;
      }
    }

    if (restartRoll < 0.12) {
      return context.possession === MatchPossession.USER
        ? MatchEventType.FREE_KICK_FOR_EVENT
        : MatchEventType.FREE_KICK_AGAINST_EVENT;
    }

    return null;
  }

  resolvePossessionFromRestartEvent(eventType: MatchEventType): MatchPossession {
    switch (eventType) {
      case MatchEventType.PENALTY_FOR_EVENT:
      case MatchEventType.FREE_KICK_FOR_EVENT:
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.THROW_IN_FOR_EVENT:
        return MatchPossession.USER;
      default:
        return MatchPossession.OPPONENT;
    }
  }

  resolveRestartEventByZone(
    zone: MatchFieldZone,
    beneficiarySide: MatchPossession,
  ): MatchEventType {
    switch (zone) {
      case MatchFieldZone.BOX:
        return beneficiarySide === MatchPossession.USER
          ? MatchEventType.PENALTY_FOR_EVENT
          : MatchEventType.PENALTY_AGAINST_EVENT;
      case MatchFieldZone.ATTACK_THIRD:
      case MatchFieldZone.DEFENSE_THIRD:
        return beneficiarySide === MatchPossession.USER
          ? MatchEventType.FREE_KICK_FOR_EVENT
          : MatchEventType.FREE_KICK_AGAINST_EVENT;
      case MatchFieldZone.MIDFIELD:
      default: {
        const midFieldPool =
          beneficiarySide === MatchPossession.USER
            ? [MatchEventType.FREE_KICK_FOR_EVENT, MatchEventType.THROW_IN_FOR_EVENT]
            : [MatchEventType.FREE_KICK_AGAINST_EVENT, MatchEventType.THROW_IN_AGAINST_EVENT];

        return this.pick(midFieldPool, MatchEventType.FREE_KICK_FOR_EVENT);
      }
    }
  }
}
