import { AppLocale, TranslationParams } from 'src/i18n/i18n.service';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchPossession } from '../model/match-possession.enum';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from './match-localized-turn-message.interface';

export interface TurnMessageMetadata {
  minute?: number;
  turn?: number;
  teamId?: string | null;
  teamName?: string | null;
  playerName?: string | null;
}

export type TurnMessageParams =
  | TranslationParams
  | Partial<Record<AppLocale, TranslationParams>>
  | ((locale: AppLocale) => TranslationParams);

export interface TurnMessageAccumulator {
  bundle: LocalizedTurnMessages;
  items: LocalizedTurnMessageItem[];
  pushTurnMessage: (
    type: MatchMessageType,
    key: string,
    params?: TurnMessageParams,
    metadata?: TurnMessageMetadata,
  ) => void;
  pushPossessionConsequenceMessage: (
    sourcePossession: MatchPossession,
    resolvedPossession: MatchPossession,
    minute: number,
    turn: number,
  ) => void;
}
