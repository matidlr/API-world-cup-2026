import {
  StatsAwardItem,
  StatsLeaderboardItem,
  StatsPodiumItem,
} from './world-cup-stats-api.interface';

export interface WorldCupStatsViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoDataState: boolean;
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
