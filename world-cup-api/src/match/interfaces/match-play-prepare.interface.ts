import { PlayRequest } from '../request/play.request';
import { MatchPlayStageContext } from './match-play-stage.interface';

export interface MatchPlayPrepareHelperContract {
  prepare(request: PlayRequest): Promise<MatchPlayStageContext>;
}
