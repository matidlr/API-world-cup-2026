import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import {
  MatchNarrativeVariantHelperContract,
  ResolveTurnResultSuccessParams,
} from '../interfaces/match-narrative-variant.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import {
  TURN_CONTEXT_VARIANT_ACTIONS,
  TURN_CONTEXT_VARIANT_COUNT,
  TURN_RESULT_OUTCOME_VARIANT_COUNT,
  TURN_RESULT_VARIANT_ACTIONS,
  TURN_RESULT_VARIANT_COUNT,
} from '../model/match-engine.constants';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
/**
 * Resolves narrative keys/variants and result semantic for one turn.
 */
export class MatchNarrativeVariantHelper
  extends AbstractMatchBasicHelper
  implements MatchNarrativeVariantHelperContract
{
  constructor(private readonly i18nService: I18nService) {
    super();
  }

  resolveTurnContextKey(action: MatchAction): string {
    if (!TURN_CONTEXT_VARIANT_ACTIONS.has(action)) {
      return 'match.turn.context';
    }

    const variantIndex = this.randomInt(1, TURN_CONTEXT_VARIANT_COUNT);
    const variantKey = `match.turn.context.${action}.${variantIndex}`;
    if (this.hasI18nKey(variantKey)) {
      return variantKey;
    }

    return 'match.turn.context';
  }

  resolveTurnResultKey(
    action: MatchAction | null,
    actionOutcome: MatchActionOutcome | undefined,
    success: boolean,
    fallbackKey: string,
  ): string {
    if (actionOutcome) {
      const outcomeVariantIndex = this.randomInt(1, TURN_RESULT_OUTCOME_VARIANT_COUNT);
      const outcomeVariantKey = `match.turn.result.outcome.${actionOutcome}.${outcomeVariantIndex}`;
      if (this.hasI18nKey(outcomeVariantKey)) {
        return outcomeVariantKey;
      }

      const outcomeFallbackKey = `match.turn.result.outcome.${actionOutcome}`;
      if (this.hasI18nKey(outcomeFallbackKey)) {
        return outcomeFallbackKey;
      }
    }

    if (!action || !TURN_RESULT_VARIANT_ACTIONS.has(action)) {
      return fallbackKey;
    }

    const outcome = success ? 'success' : 'fail';
    const variantIndex = this.randomInt(1, TURN_RESULT_VARIANT_COUNT);
    const variantKey = `match.turn.result.${outcome}.${action}.${variantIndex}`;
    if (this.hasI18nKey(variantKey)) {
      return variantKey;
    }

    return fallbackKey;
  }

  resolveTurnResultSuccess(params: ResolveTurnResultSuccessParams): boolean {
    const { action, actionOutcome, userHasPossession, userTeamId, ballCarrierTeamId } = params;
    const userRecoveredBall = ballCarrierTeamId === userTeamId;

    if (actionOutcome) {
      switch (actionOutcome) {
        case MatchActionOutcome.PASS_SUCCESS_PROGRESS:
        case MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS:
        case MatchActionOutcome.DRIBBLE_WON:
        case MatchActionOutcome.PRESS_WON:
        case MatchActionOutcome.TACKLE_WON:
        case MatchActionOutcome.DEFEND_HOLD:
        case MatchActionOutcome.ATTACK_PROGRESS:
        case MatchActionOutcome.HOLD_STABLE:
        case MatchActionOutcome.CROSS_CONNECTED:
        case MatchActionOutcome.SHOOT_USER_GOAL:
          return true;
        case MatchActionOutcome.PASS_INTERCEPTED:
        case MatchActionOutcome.LONG_PASS_LOST:
        case MatchActionOutcome.DRIBBLE_LOST:
        case MatchActionOutcome.PRESS_LOST:
        case MatchActionOutcome.TACKLE_LOST:
        case MatchActionOutcome.DEFEND_BROKEN:
        case MatchActionOutcome.ATTACK_STALLED:
        case MatchActionOutcome.HOLD_LOST:
        case MatchActionOutcome.CROSS_CLEARED:
        case MatchActionOutcome.SHOOT_BLOCKED_REBOUND_FOR:
        case MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST:
        case MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR:
        case MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST:
        case MatchActionOutcome.SHOOT_MISSED:
        case MatchActionOutcome.SHOOT_OPPONENT_GOAL:
          return false;
        default:
          break;
      }
    }

    if (!action) {
      return userRecoveredBall;
    }

    if (!userHasPossession) {
      return userRecoveredBall;
    }

    if (
      action === MatchAction.SHOOT ||
      action === MatchAction.LEFT ||
      action === MatchAction.RIGHT ||
      action === MatchAction.CENTER ||
      action === MatchAction.PICAR
    ) {
      return false;
    }

    return userRecoveredBall;
  }

  private hasI18nKey(key: string): boolean {
    return this.i18nService.t(key, 'en') !== key;
  }
}
