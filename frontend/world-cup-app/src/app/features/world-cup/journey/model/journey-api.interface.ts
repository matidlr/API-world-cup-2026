export type JourneyResultStyle = 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';

export interface JourneyTimelineApiItem {
  stage: string;
  stageLabel: string;
  matchCode: string;
  opponentTeamId: string;
  opponentTeamName: string;
  opponentFlag: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  scoreLabel: string;
  result: string;
  resultLabel: string;
  resultStyle: JourneyResultStyle;
  resolution: string;
  resolutionLabel: string;
  isPending: boolean;
}

export interface JourneyApiResponse {
  worldCupId: string;
  teamId: string;
  teamName: string;
  lang: 'es' | 'en';
  worldCupStatus: string;
  stageReached: string;
  stageReachedLabel: string;
  isChampion: boolean;
  isFinalPending: boolean;
  eliminatedByTeamId: string | null;
  eliminatedByTeamName: string | null;
  summary: string;
  matchesPlayed: number;
  matches: JourneyTimelineApiItem[];
}
