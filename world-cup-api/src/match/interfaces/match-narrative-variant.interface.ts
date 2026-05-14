import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';

export interface ResolveTurnResultSuccessParams {
  action: MatchAction | null;
  actionOutcome?: MatchActionOutcome;
  userHasPossession: boolean;
  userTeamId: string;
  ballCarrierTeamId: string;
}

export interface MatchNarrativeVariantHelperContract {
  resolveTurnContextKey(action: MatchAction): string;
  resolveTurnResultKey(
    action: MatchAction | null,
    actionOutcome: MatchActionOutcome | undefined,
    success: boolean,
    fallbackKey: string,
  ): string;
  resolveTurnResultSuccess(params: ResolveTurnResultSuccessParams): boolean;
}
