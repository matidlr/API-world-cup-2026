import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';

export interface MatchGoalScorerSelectionParams {
  players: TeamPlayer[];
  fallbackPlayer: TeamPlayer;
  action: MatchAction;
  zone: MatchFieldZone;
}
