export interface FinalistPreviewApiItem {
  teamId: string;
  teamName: string;
  flag: string;
  attack: number;
  defense: number;
  midfield: number;
  overall: number;
  coachName: string;
  formation: string;
  strategy: string;
  strategyLabel: string;
}

export interface SimulationApiResponse {
  teamId: string;
  worldCupId: string;
  edition: number;
  status: string;
  hasActiveFinal: boolean;
  canResimulate: boolean;
  canStartFinal: boolean;
  selectedTeamId: string;
  selectedTeamName: string;
  selectedTeamInFinal: boolean;
  finalMatchId: string | null;
  finalHomeTeam: FinalistPreviewApiItem;
  finalAwayTeam: FinalistPreviewApiItem;
}
