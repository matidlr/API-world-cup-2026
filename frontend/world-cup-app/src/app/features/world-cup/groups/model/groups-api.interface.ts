export type QualificationBadge = 'QUALIFIED' | 'BEST_THIRD' | 'NONE';

export interface GroupTeamRowApiItem {
  teamId: string;
  teamName: string;
  confederation: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  goalDifferenceLabel: string;
  points: number;
  position: number;
  isQualified: boolean;
  isBestThird: boolean;
  isSelectedTeam: boolean;
  qualificationBadge: QualificationBadge;
}

export interface GroupTableApiItem {
  group: string;
  matchesPlayed: number;
  hasBestThird: boolean;
  teams: GroupTeamRowApiItem[];
}

export interface GroupsApiResponse {
  teamId: string;
  worldCupId: string | null;
  worldCupStatus: string | null;
  selectedGroup: string | null;
  groups: GroupTableApiItem[];
}
