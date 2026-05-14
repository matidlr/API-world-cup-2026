import { TurnContext } from './match-turn-context.interface';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';

export interface MatchOpenPlayRestartHelperContract {
  resolveOpenPlayRestartEvent(context: TurnContext, isGoal: boolean): MatchEventType | null;
  resolveRestartEventByZone(zone: MatchFieldZone, beneficiarySide: MatchPossession): MatchEventType;
  resolvePossessionFromRestartEvent(eventType: MatchEventType): MatchPossession;
}
