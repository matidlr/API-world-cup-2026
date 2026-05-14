import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';

export interface TurnContext {
  action: MatchAction;
  eventType: MatchEventType;
  possession: MatchPossession;
  zone: MatchFieldZone;
  actingTeamId: string;
  actingTeamName: string;
  actingPlayer: TeamPlayer;
}
