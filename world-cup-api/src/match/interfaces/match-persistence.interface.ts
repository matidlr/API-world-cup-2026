import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchCurrentContext } from './match-current-context.interface';
import { TranslationParams } from 'src/i18n/i18n.service';

export interface RecordMatchTurnContextParams {
  matchId: string;
  turn: number;
  minute: number;
  phase: 'START' | 'TURN' | 'END';
  selectedAction: MatchAction | null;
  actionOutcome: MatchActionOutcome | null;
  headline: string | null;
  context: MatchCurrentContext;
}

export interface RecordMatchStatParams {
  matchId: string;
  minute: number;
  turn: number;
  eventType: MatchEventType;
  zone?: MatchFieldZone | null;
  action: MatchAction | null;
  teamId: string | null;
  teamName: string | null;
  playerName: string | null;
  playerPosition: string | null;
  cardType: MatchCardType | null;
  isGoal: boolean;
  message: string;
  messageKey?: string | null;
  messageParams?: TranslationParams | null;
}

export interface MatchPersistenceHelperContract {
  recordMatchTurnContext(params: RecordMatchTurnContextParams): Promise<void>;
  recordMatchStat(params: RecordMatchStatParams): Promise<void>;
}
