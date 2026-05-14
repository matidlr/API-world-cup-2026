import { MatchEnginePreparePlayResult } from './match-engine.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchCurrentContext } from './match-current-context.interface';
import { MatchResponse } from '../model/match-response.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { PlayRequest } from '../request/play.request';
import { MatchPlayResponsePayload } from './match-play-response-payload.interface';
import { MatchPlayPostTurnPayload } from './match-play-post-turn-payload.interface';

export interface MatchPlayStageContext {
  request: PlayRequest;
  preparedTurn: MatchEnginePreparePlayResult;
  selectedAction: MatchAction;
  currentContext?: MatchCurrentContext | null;
  messageItems?: MatchMessageItem[];
  headline?: string;
  response?: MatchResponse;
  postTurnPayload?: MatchPlayPostTurnPayload;
  responsePayload?: MatchPlayResponsePayload;
}

export interface MatchPlaySpecialEventsResult {
  handled: boolean;
  response?: MatchResponse;
  context?: MatchPlayStageContext;
}
