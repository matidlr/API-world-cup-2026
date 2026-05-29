export interface CurrentWorldCupApiResponse {
  worldCupId?: string;
  edition?: number;
  status?: string;
  hasActiveFinal?: boolean;
  canResimulate?: boolean;
  canStartFinal?: boolean;
  selectedTeamId?: string;
  selectedTeamName?: string;
  finalHomeTeamId?: string;
  finalHomeTeamName?: string;
  finalAwayTeamId?: string;
  finalAwayTeamName?: string;
  finalMatchId?: string | null;
}
