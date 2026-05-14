export type MatchStageCode =
  | 'ALL'
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

export interface MatchStageFilterItem {
  stage: MatchStageCode;
  label: string;
  count: number;
}

export interface MatchCardApiItem {
  stage: Exclude<MatchStageCode, 'ALL'>;
  stageLabel: string;
  groupName: string | null;
  matchCode: string;
  homeTeamId: string;
  homeTeamName: string;
  homeFlag: string;
  awayTeamId: string;
  awayTeamName: string;
  awayFlag: string;
  scoreLabel: string;
  penaltyLabel: string | null;
  resolution: string;
  resolutionLabel: string;
  isPending: boolean;
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  winnerFlag: string | null;
  playerOfMatchName: string | null;
  playerOfMatchTeamId: string | null;
  playerOfMatchFlag: string | null;
  goalsSummary: string | null;
  cardsSummary: string | null;
}

export interface MatchesApiResponse {
  teamId: string;
  lang: 'es' | 'en';
  worldCupId?: string;
  selectedStage: MatchStageCode;
  availableStages: MatchStageFilterItem[];
  totalMatches: number;
  playedMatches: number;
  pendingMatches: number;
  matches: MatchCardApiItem[];
}
