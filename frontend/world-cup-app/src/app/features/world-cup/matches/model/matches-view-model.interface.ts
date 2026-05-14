import { MatchCardApiItem, MatchStageCode, MatchStageFilterItem } from './matches-api.interface';

export interface MatchesViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoSimulationState: boolean;
  selectedStage: MatchStageCode;
  stages: MatchStageFilterItem[];
  totalMatches: number;
  playedMatches: number;
  pendingMatches: number;
  matches: MatchCardApiItem[];
}
