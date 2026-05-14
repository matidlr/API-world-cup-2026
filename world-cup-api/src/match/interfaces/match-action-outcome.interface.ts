import { TeamPlayer } from 'src/teams/model/team-player.model';
import { TranslationParams } from 'src/i18n/i18n.service';
import { MatchEntity } from '../entity/match.entity';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchCurrentContext } from './match-current-context.interface';
import { TacticalSnapshot } from './match-tactical-snapshot.interface';
import { TurnContext } from './match-turn-context.interface';

export interface MatchActionOutcomeIncident {
  type: MatchActionOutcomeIncidentType;
  eventType?: MatchEventType;
  zone?: MatchFieldZone;
  possession?: MatchPossession;
  teamId?: string;
  teamName?: string;
  playerName?: string;
  action?: MatchAction | null;
  cardType?: MatchCardType | null;
  messageKey?: string;
  messageParams?: TranslationParams;
}

export interface ResolveMatchActionOutcomeParams {
  match: MatchEntity;
  context: TurnContext;
  currentContext: MatchCurrentContext;
  tactical: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  actionsByEvent: Record<MatchEventType, MatchAction[]>;
  baseUserPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
  isExecutingRegularPenalty: boolean;
}

export interface MatchActionOutcomeResult {
  scoreTeam: number;
  scoreOpponent: number;
  message: string;
  isGoal: boolean;
  goalMessageKey:
    | 'match.turn.userGoal'
    | 'match.turn.opponentGoal'
    | 'match.turn.userCounterGoal'
    | 'match.turn.opponentCounterGoal'
    | null;
  statTeamId: string;
  statTeamName: string;
  statPlayerName: string;
  statPlayerPosition: string;
  statAction: MatchAction | null;
  ballCarrierTeamId: string;
  ballCarrierName: string;
  actionOutcome: MatchActionOutcome;
  nextZone: MatchFieldZone;
  nextPossession: MatchPossession;
  nextEventType: MatchEventType;
  actingPlayer: TeamPlayer;
  incidents: MatchActionOutcomeIncident[];
}

export interface MatchActionOutcomeHelperContract {
  resolveActionOutcome(params: ResolveMatchActionOutcomeParams): MatchActionOutcomeResult;
}
