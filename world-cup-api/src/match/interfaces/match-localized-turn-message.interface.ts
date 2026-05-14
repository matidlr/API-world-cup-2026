import { MatchMessageType } from '../model/match-message-type.enum';

export interface LocalizedTurnMessages {
  en: string[];
  es: string[];
}

export interface LocalizedTurnMessageItem {
  key?: string;
  type: MatchMessageType;
  en: string;
  es: string;
  minute?: number;
  turn?: number;
  teamId?: string | null;
  teamName?: string | null;
  playerName?: string | null;
}
