import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchLanguage } from '../model/match-language.model';

export interface MatchRuntimeConfigHelperContract {
  resolveLanguage(language?: string | MatchLanguage): MatchLanguage;
  loadActionsByEvent(): Record<MatchEventType, MatchAction[]>;
  loadMaxTurnsPerMatch(): number;
  loadMaxMessagesPerTurn(): number;
  loadMaxSubstitutionsPerTeam(): number;
  loadAutoAdjustFormationOnStrategyChange(): boolean;
  loadOpponentTacticsOnlySecondHalfEnabled(): boolean;
  loadOpponentTacticsCooldownTurns(): number;
  loadOpponentMaxStrategyChangesPerMatch(): number;
  loadCoachFormationStyleStrictness(): number;
}
