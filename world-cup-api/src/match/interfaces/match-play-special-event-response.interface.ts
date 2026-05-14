import { MatchEnginePreparePlayResult } from './match-engine.interface';
import { MatchResponse } from '../model/match-response.model';

export interface MatchPlaySpecialEventResponseHelperContract {
  resolveQuitMatch(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse>;
  resolveHalfTimeRestart(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse>;
  resolveLastPlayEvent(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse>;
}
