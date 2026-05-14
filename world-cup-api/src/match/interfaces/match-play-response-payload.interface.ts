import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from './match-localized-turn-message.interface';
import { MatchCurrentContext, TacticalSnapshot } from './match-service.interfaces';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchLanguage } from '../model/match-language.model';

export interface MatchPlayResponsePayload {
  match: MatchEntity;
  language: MatchLanguage;
  tacticalSnapshot: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  selectedAction: MatchAction;
  actionOutcome: MatchActionOutcome | null;
  turnMessages: LocalizedTurnMessages;
  turnMessageItems: LocalizedTurnMessageItem[];
  currentContext: MatchCurrentContext;
}
