import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchCurrentContext } from './match-current-context.interface';
import { TacticalSnapshot } from './match-tactical-snapshot.interface';
import { MatchFormation } from '../model/match-formation.enum';

export interface BuildMatchCurrentContextParams {
  match: MatchEntity;
  eventType: string;
  zone: string;
  possession: string;
  actingPlayer: TeamPlayer;
  availableActions?: MatchAction[];
  actionsByEvent?: Record<MatchEventType, MatchAction[]>;
  tacticalSnapshot: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  isPendingSetPiece: boolean;
  lastAction?: MatchAction;
  lastOutcome?: string;
}

export interface MatchContextBuilderHelperContract {
  getPlayersByZone(
    players: TeamPlayer[],
    zone: MatchFieldZone,
    isActingTeam: boolean,
    options?: {
      formation?: MatchFormation | null;
      recentActorId?: string | null;
    },
  ): TeamPlayer[];
  getActionPoolForTurn(
    eventType: MatchEventType,
    possession: MatchPossession,
    actionsByEvent: Record<MatchEventType, MatchAction[]>,
  ): MatchAction[];
  getAvailableActions(
    eventType: MatchEventType,
    zone: MatchFieldZone,
    possession: MatchPossession,
    actionsByEvent: Record<MatchEventType, MatchAction[]>,
  ): MatchAction[];
  buildContext(params: BuildMatchCurrentContextParams): Promise<MatchCurrentContext>;
}
