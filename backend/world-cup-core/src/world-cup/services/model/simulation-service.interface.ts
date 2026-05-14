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

export interface TeamStatsApiResponse {
  attack?: number;
  defense?: number;
  midfield?: number;
  overall?: number;
  current_strategy?: string;
  current_formation?: string;
}

export interface TeamCatalogApiItem {
  id?: string;
  name?: string;
  coach?: string;
}

export interface FinalistPreview {
  teamId: string;
  teamName: string;
  attack: number;
  defense: number;
  midfield: number;
  overall: number;
  coachName: string;
  formation: string;
  strategy: string;
  strategyLabel: string;
}

export interface SimulationScreenResponse {
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
  finalHomeTeam: FinalistPreview;
  finalAwayTeam: FinalistPreview;
}
