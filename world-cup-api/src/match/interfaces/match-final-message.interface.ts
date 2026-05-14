import { MatchEntity } from '../entity/match.entity';
import { MatchLanguage } from '../model/match-language.model';

export interface MatchFinalMessageHelperContract {
  buildFinalMessageLocalized(match: MatchEntity, language: MatchLanguage): string;
}
