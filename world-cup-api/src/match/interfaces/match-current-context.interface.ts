import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { TacticalSnapshot } from './match-tactical-snapshot.interface';

export interface MatchCurrentContext {
  matchId: string;
  turn: number;
  minute: number;

  eventType: MatchEventType;
  zone: MatchFieldZone;
  possession: MatchPossession;

  userTeamId: string;
  userTeamName: string;
  opponentTeamId: string;
  opponentTeamName: string;

  actingTeamId: string;
  actingTeamName: string;
  defendingTeamId: string;
  defendingTeamName: string;

  actingPlayer: TeamPlayer;

  teammatesInZone: TeamPlayer[];
  opponentsInZone: TeamPlayer[];

  actingOnFieldCount: number;
  defendingOnFieldCount: number;

  tacticalSnapshot: TacticalSnapshot;
  availableActions: MatchAction[];

  isPendingSetPiece: boolean;
  isRivalryMatch: boolean;

  lastAction?: MatchAction;
  lastOutcome?: string;
}
