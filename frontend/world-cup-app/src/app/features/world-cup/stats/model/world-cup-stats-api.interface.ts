export interface StatsPodiumItem {
  place: 'CHAMPION' | 'RUNNER_UP' | 'THIRD_PLACE' | 'FOURTH_PLACE';
  placeLabel: string;
  medal: string;
  teamId: string;
  teamName: string;
  flag: string;
}

export interface StatsLeaderboardItem {
  rank: number;
  playerName: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  value: number;
}

export interface StatsAwardItem {
  code: string;
  title: string;
  icon: string;
  winnerName: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  reason: string;
}

export interface WorldCupStatsApiResponse {
  teamId: string;
  lang: 'es' | 'en';
  worldCupId: string | null;
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  totalYellowCards: number;
  totalRedCards: number;
  podium: StatsPodiumItem[];
  topScorers: StatsLeaderboardItem[];
  topAssists: StatsLeaderboardItem[];
  awards: StatsAwardItem[];
}
