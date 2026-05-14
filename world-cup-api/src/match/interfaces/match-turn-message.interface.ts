import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';

export interface TurnMessageBundle {
  en: string[];
  es: string[];
}

export interface TurnMessageParamsByLocale {
  en: Record<string, string | number | null | undefined>;
  es: Record<string, string | number | null | undefined>;
}

export interface TurnNarrativeContext {
  language: MatchLanguage;
  zone: MatchFieldZone;
  playerName: string;
  teamName: string;
}
