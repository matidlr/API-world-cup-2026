import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { MatchActionOutcomeIncident } from './match-action-outcome.interface';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchPossession } from '../model/match-possession.enum';

export interface ResolvePenaltyAwardIncidentParams {
  eventType: MatchEventType.PENALTY_FOR_EVENT | MatchEventType.PENALTY_AGAINST_EVENT;
  match: MatchEntity;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  baseUserPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
}

export interface MatchPenaltyAwardResolution {
  awardedSide: MatchPossession;
  awardedTeamId: string;
  awardedTeamName: string;
  designatedPenaltyTaker: TeamPlayer;
  incident: MatchActionOutcomeIncident;
}

export interface MatchPenaltySaveResolution {
  defendingSide: MatchPossession;
  defendingTeamId: string;
  defendingTeamName: string;
  goalkeeper: TeamPlayer;
  incident: MatchActionOutcomeIncident;
}

export interface MatchPenaltyResolutionHelperContract {
  resolvePenaltyAwardIncident(params: ResolvePenaltyAwardIncidentParams): MatchPenaltyAwardResolution;
  resolvePenaltySaveIncident(params: ResolvePenaltyAwardIncidentParams): MatchPenaltySaveResolution;
}
