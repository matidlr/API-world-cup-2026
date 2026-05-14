import { MatchResponse } from '../model/match-response.model';
import { MatchPlayStageContext } from './match-play-stage.interface';

export interface MatchPlayResponseHelperContract {
  build(context: MatchPlayStageContext): Promise<MatchResponse>;
}
