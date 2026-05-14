import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchCurrentContext } from './match-current-context.interface';

export interface MatchDuelInput {
  context: MatchCurrentContext;
  action: MatchAction;
}

export interface MatchDuelResult {
  handled: boolean;
  outcome: MatchActionOutcome;
  success: boolean;
  fromPlayer: TeamPlayer;
  toPlayer: TeamPlayer;
  defenderPlayer: TeamPlayer | null;
  nextZone: MatchFieldZone;
  nextPossession: MatchPossession;
  wasSavedByGoalkeeper: boolean;
}

export interface MatchDuelHelperContract {
  resolveDuel(input: MatchDuelInput): MatchDuelResult;
}
