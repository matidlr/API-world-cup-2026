import { MatchEntity } from '../entity/match.entity';
import { TranslationParams } from 'src/i18n/i18n.service';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { MatchAction } from '../model/match-action.enum';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchActionOutcomeResult } from './match-action-outcome.interface';
import {
  TurnMessageMetadata,
  TurnMessageParams,
} from './match-turn-message-accumulator.interface';

export enum MatchOutcomeNarrativeMode {
  REGULAR = 'REGULAR',
  LAST_PLAY = 'LAST_PLAY',
}

export interface MatchOutcomeMessageDescriptor {
  type: MatchMessageType;
  key: string;
  params: TurnMessageParams;
  metadata: TurnMessageMetadata;
  timelineMessageEn: string;
  incidentType: MatchActionOutcomeIncidentType | null;
}

export interface ResolveOutcomeMessageParams {
  match: MatchEntity;
  turnOutcome: MatchActionOutcomeResult;
  action: MatchAction | null;
  minute: number;
  turn: number;
  mode?: MatchOutcomeNarrativeMode;
  lastPlayAttackingTeamId?: string | null;
}

export interface ResolveRestartOutcomeMessageParams {
  messageKey: string;
  minute: number;
  turn: number;
  teamId?: string | null;
  teamName?: string | null;
  playerName?: string | null;
  messageParams?: TranslationParams;
  incidentType?: MatchActionOutcomeIncidentType | null;
}

export interface MatchOutcomeMessageHelperContract {
  resolveOutcomeMessage(params: ResolveOutcomeMessageParams): MatchOutcomeMessageDescriptor;
  resolveRestartMessage(params: ResolveRestartOutcomeMessageParams): MatchOutcomeMessageDescriptor;
}
