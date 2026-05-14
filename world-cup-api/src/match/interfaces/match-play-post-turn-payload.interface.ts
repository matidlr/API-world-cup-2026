import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from './match-localized-turn-message.interface';
import { MatchCurrentContext, TacticalSnapshot } from './match-service.interfaces';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchAction } from '../model/match-action.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { OpponentTacticalAdjustment } from './match-team-tactical-state.interface';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';

export interface MatchPlayPostTurnPayload {
  match: MatchEntity;
  nextMinute: number;
  actingPlayer: TeamPlayer;
  language: MatchLanguage;
  selectedAction: MatchAction;
  resolvedActionOutcome: MatchActionOutcome | null;
  turnMessages: LocalizedTurnMessages;
  turnMessageItems: LocalizedTurnMessageItem[];
  baseUserPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  tacticalSnapshot: TacticalSnapshot;
  currentContext: MatchCurrentContext;
  pushTurnMessage: (
    type: MatchMessageType,
    key: string,
    payload?: any,
    metadata?: {
      minute?: number;
      turn?: number;
      teamId?: string | null;
      teamName?: string | null;
      playerName?: string | null;
    },
  ) => void;
  shouldEnterHalfTime: (match: MatchEntity) => boolean;
  isLastPlayEvent: (eventType: MatchEventType) => boolean;
  maybeApplyOpponentTacticalAdjustment: (
    match: MatchEntity,
    params: { phase: MatchCoachTacticalPhase; minute: number; eventType: MatchEventType },
  ) => Promise<OpponentTacticalAdjustment | null>;
  resolveHalfTimeSummaryKey: (
    match: MatchEntity,
  ) => 'match.halftime.summary.leading' | 'match.halftime.summary.drawing' | 'match.halftime.summary.trailing';
  resolveHalfTimeVariantKey: () => string;
  recordMatchStat: (params: {
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
    messageParams?: any;
  }) => Promise<void>;
  prepareLastPlayTurn: (params: {
    match: MatchEntity;
    language: MatchLanguage;
    turnMessages: LocalizedTurnMessages;
    turnMessageItems: LocalizedTurnMessageItem[];
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
  }) => Promise<void>;
  closeMatchAtNinety: (
    match: MatchEntity,
    userPlayers: TeamPlayer[],
    opponentPlayers: TeamPlayer[],
  ) => Promise<void>;
  buildFinalMessageLocalized: (match: MatchEntity, language: MatchLanguage) => string;
}
