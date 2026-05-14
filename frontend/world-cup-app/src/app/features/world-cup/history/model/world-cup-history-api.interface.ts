export interface HistoricalPodiumTeamItem {
  teamId: string;
  teamName: string;
  flag: string;
  hasData: boolean;
}

export interface HistoricalPlayerHighlightItem {
  playerName: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  value: number;
  hasData: boolean;
}

export interface HistoricalFairPlayHighlightItem {
  teamId: string;
  teamName: string;
  teamFlag: string;
  fairPlayPoints: number;
  yellowCards: number;
  redCards: number;
  fairPlayRank: number;
  totalRankedTeams: number;
  hasData: boolean;
}

export interface HistoricalWorldCupItem {
  worldCupId: string;
  worldCupIdShort: string;
  finalPlayedAt: string | null;
  edition: number;
  editionLabel: string;
  status: string;
  statusLabel: string;
  champion: HistoricalPodiumTeamItem;
  runnerUp: HistoricalPodiumTeamItem;
  thirdPlace: HistoricalPodiumTeamItem;
  fourthPlace: HistoricalPodiumTeamItem;
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  yellowCards: number;
  redCards: number;
  finalScoreLabel: string;
  finalResolutionLabel: string;
  topScorer: HistoricalPlayerHighlightItem;
  topAssist: HistoricalPlayerHighlightItem;
  fairPlay: HistoricalFairPlayHighlightItem;
  worstFairPlay: HistoricalFairPlayHighlightItem;
}

export interface WorldCupHistoryApiResponse {
  teamId: string;
  lang: 'es' | 'en';
  totalWorldCups: number;
  worldCups: HistoricalWorldCupItem[];
}
