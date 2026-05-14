/** Estado del mundial actual */
export interface WorldCup {
  worldCupId: string;
  edition: number;
  year: number;
  host: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED';
  hasActiveFinal: boolean;
  canResimulate: boolean;
  canStartFinal: boolean;
  selectedTeamId: string;
  selectedTeamName: string;
  finalHomeTeamId?: string;
  finalHomeTeamName?: string;
  finalAwayTeamId?: string;
  finalAwayTeamName?: string;
  finalMatchId?: string;
}

/** Equipo en una posición de grupo */
export interface GroupEntry {
  teamId: string;
  name: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualified?: boolean;
  isBestThird?: boolean;
}

/** Grupo de la fase de grupos */
export interface Group {
  groupId: string;
  name: string;
  teams: GroupEntry[];
}

/** Etapas disponibles del torneo */
export type MatchStage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

/** Partido del mundial */
export interface Match {
  matchId: string;
  stage: MatchStage;
  group?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamFlag: string;
  homeScore?: number;
  awayScore?: number;
  date?: string;
  venue?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
}

/** Ítem del recorrido del equipo */
export interface JourneyItem {
  matchId: string;
  stage: MatchStage;
  opponentId: string;
  opponentName: string;
  opponentFlag: string;
  isHome: boolean;
  myScore?: number;
  opponentScore?: number;
  result?: 'WIN' | 'DRAW' | 'LOSS';
  date?: string;
}

/** Mundial histórico */
export interface WorldCupHistory {
  worldCupId: string;
  year: number;
  host: string;
  champion: string;
  championFlag: string;
  runnerUp: string;
  thirdPlace?: string;
  totalGoals?: number;
  totalMatches?: number;
}
