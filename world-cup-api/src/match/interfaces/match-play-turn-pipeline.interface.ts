import { MatchPlayStageContext } from './match-play-stage.interface';

export interface MatchPlayTurnPipelineContract {
  apply(context: MatchPlayStageContext): Promise<MatchPlayStageContext>;
}
