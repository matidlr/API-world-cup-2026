import { MatchEntity } from '../entity/match.entity';
import { MatchCurrentContext } from './match-current-context.interface';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { MatchOption } from '../model/match-option.model';
import { MatchResponse } from '../model/match-response.model';
import { MatchResult } from '../model/match-result.enum';
import { MatchAction } from '../model/match-action.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';

export interface MatchCoachMetadata {
  teamCoachName: string | null;
  teamCoachProfile: CoachProfile | null;
  opponentCoachName: string | null;
  opponentCoachProfile: CoachProfile | null;
}

export interface BuildMatchResponseParams {
  match: MatchEntity;
  language: MatchLanguage;
  coachMetadata: MatchCoachMetadata;
  optionsJson: string;
  messageItems?: MatchMessageItem[];
  currentContext?: MatchCurrentContext | null;
}

export interface MatchResponseMapperHelperContract {
  safeParseCurrentContext(raw: string | null | undefined): MatchCurrentContext | null;
  safeParseOptions(optionsJson: string): MatchOption[];
  getActionLabel(action: MatchAction, language: MatchLanguage, fallback?: string): string;
  localizeOptions(options: MatchOption[], language: MatchLanguage): MatchOption[];
  resolveMatchResult(match: MatchEntity): MatchResult | null;
  buildMatchResponse(params: BuildMatchResponseParams): MatchResponse;
}
