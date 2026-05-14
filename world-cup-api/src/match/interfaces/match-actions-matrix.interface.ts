import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';

export interface MatchActionsMatrixContract {
  getAvailableActions(
    eventType: MatchEventType,
    zone: MatchFieldZone,
    possession: MatchPossession,
  ): MatchAction[];
}
