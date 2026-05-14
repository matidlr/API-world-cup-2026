import { MatchEntity } from '../entity/match.entity';
import { MatchEventType } from '../model/match-event-type.enum';
import { TeamPlayer } from 'src/teams/model/team-player.model';

export interface MatchPenaltySaveContextParams {
  eventType: MatchEventType;
  match: MatchEntity;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  baseUserPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
}

export interface MatchPenaltySaveContext {
  defendingTeamId: string;
  defendingTeamName: string;
  goalkeeperName: string;
}
