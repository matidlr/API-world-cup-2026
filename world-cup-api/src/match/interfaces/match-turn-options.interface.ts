import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchOption } from '../model/match-option.model';
import { MatchPossession } from '../model/match-possession.enum';

export interface BuildMatchTurnOptionsParams {
  eventType: MatchEventType;
  language: MatchLanguage;
  possession: MatchPossession;
  zone: MatchFieldZone;
  actionsByEvent: Record<MatchEventType, MatchAction[]>;
}

export interface PickOpponentActionParams {
  eventType: MatchEventType;
  possession: MatchPossession;
  actionsByEvent: Record<MatchEventType, MatchAction[]>;
}

export interface ResolveUserActionPoolParams {
  eventType: MatchEventType;
  possession: MatchPossession;
  zone: MatchFieldZone;
  actionsByEvent: Record<MatchEventType, MatchAction[]>;
}

export interface ResolveActionPoolParams {
  eventType: MatchEventType;
  possession: MatchPossession;
  actionsByEvent: Record<MatchEventType, MatchAction[]>;
}

export interface ResolveTurnSelectedActionsParams {
  eventType: MatchEventType;
  possession: MatchPossession;
  zone: MatchFieldZone;
  pool: MatchAction[];
}

export interface MatchTurnOptionsHelperContract {
  buildOptions(params: BuildMatchTurnOptionsParams): MatchOption[];
  pickOpponentAction(params: PickOpponentActionParams): MatchAction;
}
