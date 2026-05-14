import { MatchPlaySpecialEventsResult, MatchPlayStageContext } from './match-play-stage.interface';

export interface MatchPlaySpecialEventsHelperContract {
  handle(context: MatchPlayStageContext): Promise<MatchPlaySpecialEventsResult>;
}
