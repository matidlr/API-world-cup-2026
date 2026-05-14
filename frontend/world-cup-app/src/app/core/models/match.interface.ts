/** Estado de un jugador en el squad del partido */
export type PlayerStatus = 'AVAILABLE' | 'INJURED' | 'SUSPENDED' | 'DOUBTFUL';

/** Jugador en el squad del partido (F11) */
export interface SquadPlayer {
  playerId: string;
  name: string;
  number: number;
  position: string;
  status: PlayerStatus;
  injuryDetail?: string;
}

/** Estado del equipo antes del partido (F11) */
export interface TeamSquadState {
  available: SquadPlayer[];
  injured: SquadPlayer[];
  suspended: SquadPlayer[];
  doubtful: SquadPlayer[];
}

/** Estadística del partido (F12) */
export interface MatchStats {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

/** Alineación del partido (F12) */
export interface Lineup {
  matchId: string;
  homeFormation: string;
  awayFormation: string;
  homePlayers: LineupPlayer[];
  awayPlayers: LineupPlayer[];
}

export interface LineupPlayer {
  playerId: string;
  name: string;
  number: number;
  position: string;
  x?: number;
  y?: number;
}

/** Tipo de mensaje para el chat (F13) */
export interface MessageType {
  messageTypeId: string;
  label: string;
  description?: string;
  icon?: string;
}

/** Evento/mensaje del chat de la final (F13) */
export type MessageItemType =
  | 'USER'
  | 'BOT'
  | 'GOAL'
  | 'SAVE'
  | 'FOUL'
  | 'CARD'
  | 'SUBSTITUTION'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'EXTRA_TIME'
  | 'PENALTY'
  | 'RESULT';

export interface MessageItem {
  type: MessageItemType;
  content: string;
  minute?: number;
  team?: string;
  player?: string;
  timestamp?: string;
}

/** Respuesta de un turno del chat (F13) */
export interface PlayTurnResponse {
  messages: MessageItem[];
  matchStatus: 'IN_PROGRESS' | 'HALF_TIME' | 'FINISHED';
  homeScore: number;
  awayScore: number;
  currentMinute?: number;
}
