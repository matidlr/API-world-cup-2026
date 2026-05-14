import { AppLocale, SUPPORTED_APP_LOCALES } from 'src/i18n/i18n.service';

export type MatchLanguage = AppLocale;
export const MATCH_SUPPORTED_LANGUAGES: ReadonlyArray<MatchLanguage> = SUPPORTED_APP_LOCALES;
