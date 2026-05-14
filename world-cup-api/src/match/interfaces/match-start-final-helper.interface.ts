import { MatchResponse } from '../model/match-response.model';
import { StartFinalRequest } from '../request/start-final.request';

export interface MatchStartFinalHelperContract {
  startFinal(request: StartFinalRequest): Promise<MatchResponse>;
}
