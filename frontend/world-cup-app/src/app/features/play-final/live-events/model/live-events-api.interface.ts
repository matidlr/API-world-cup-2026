export type LiveEventStyle = 'goal' | 'yellow' | 'red' | 'sub' | 'info';

export interface LiveEventsTeamApiItem {
  id: string;
  name: string;
  flag: string;
  strategy: string;
  strategyLabel: string;
  formation: string;
  coachName: string;
  coachProfile: string;
}

export interface LiveEventsSummaryApiItem {
  teamGoals: number;
  opponentGoals: number;
  teamYellowCards: number;
  teamRedCards: number;
  opponentYellowCards: number;
  opponentRedCards: number;
  totalGoals: number;
}

export interface LiveEventFeedApiItem {
  statId: number;
  minute: number;
  minuteLabel: string;
  turn: number;
  type: string;
  style: LiveEventStyle;
  icon: string;
  text: string;
  teamId: string | null;
  teamName: string | null;
  playerName: string | null;
}

export interface LiveEventsPlayerOfMatchApiItem {
  playerName: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  position: string | null;
}

export interface LiveEventsApiResponse {
  teamId: string;
  lang: 'es' | 'en';
  matchId: string;
  isActive: boolean;
  isFinished: boolean;
  minute: number;
  turn: number;
  zone: string | null;
  zoneLabel: string;
  score: string;
  team: LiveEventsTeamApiItem;
  opponent: LiveEventsTeamApiItem;
  summary: LiveEventsSummaryApiItem;
  playerOfMatch: LiveEventsPlayerOfMatchApiItem | null;
  events: LiveEventFeedApiItem[];
}
