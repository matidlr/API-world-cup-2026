/** Paleta de colores de un equipo */
export interface TeamTheme {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  textLight: string;
  textDark: string;
}

/** Información básica de un equipo */
export interface Team {
  teamId: string;
  name: string;
  flag: string;
  theme?: TeamTheme;
  isChampion?: boolean;
}

/** Jugador del squad */
export interface Player {
  playerId: string;
  name: string;
  position: string;
  shirtNumber: number;
  age: number;
  skill: number;
  attack: number;
  defense: number;
  energy: number;
  isCaptain: boolean;
}

/** Miembro del cuerpo técnico */
export interface Coach {
  coachId: string;
  name: string;
  role: string;
  nationality?: string;
  age?: number;
  photoUrl?: string;
}

/** Estrategia */
export interface Strategy {
  strategyId: string;
  name: string;
  description?: string;
  icon?: string;
}

/** Formación */
export interface Formation {
  formationId: string;
  name: string;
  description?: string;
  positions?: string[];
}

/** Estadísticas del equipo */
export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  yellowCards?: number;
  redCards?: number;
}

/** Rival histórico */
export interface Rival {
  rivalId: string;
  teamId: string;
  name: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}
