import { MatchPlayStageContext } from './match-play-stage.interface';

export interface MatchPlayPostTurnHelperContract {
  apply(context: MatchPlayStageContext): Promise<MatchPlayStageContext>;
}
