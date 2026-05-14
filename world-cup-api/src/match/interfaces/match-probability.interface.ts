import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchCurrentContext } from './match-current-context.interface';

export interface ActionProbabilityInput {
  context: MatchCurrentContext;
  action: MatchAction;
  actingPlayer: TeamPlayer;
  teammatesInZone: TeamPlayer[];
  opponentsInZone: TeamPlayer[];
}

export interface ActionProbabilityResult {
  successChance: number;
  goalChance: number;
  foulChance: number;
  cardChance: number;
  possessionFlipChance: number;
}

export interface MatchProbabilityHelperContract {
  resolveActionProbabilities(input: ActionProbabilityInput): ActionProbabilityResult;
}
