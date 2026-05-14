import {
  CoachingCoach,
  CoachingFormationCatalogItem,
  CoachingStrategyCatalogItem,
  CoachingTeamFormation,
  CoachingTeamRatingDeltaItem,
  CoachingTeamRatingItem,
  CoachingTeamStats,
  CoachingTeamStrategy,
} from './coaching-api.interface';

export interface CoachingViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  savingStrategy: boolean;
  savingFormation: boolean;
  savingResetDefault: boolean;
  errorMessage: string;
  selectedTeamLabel: string;
  coach: CoachingCoach | null;
  strategy: CoachingTeamStrategy | null;
  formation: CoachingTeamFormation | null;
  stats: CoachingTeamStats | null;
  strategies: CoachingStrategyCatalogItem[];
  formations: CoachingFormationCatalogItem[];
  selectedStrategy: string;
  selectedFormation: string;
  selectedStrategyDescription: string;
  compatibleFormations: string[];
  compatibleStrategies: string[];
  baseRatings: CoachingTeamRatingItem[];
  effectiveRatings: CoachingTeamRatingItem[];
  ratingDeltas: CoachingTeamRatingDeltaItem[];
  strategyPenalty: number;
  isSelectedFormationCompatible: boolean;
  tacticalStatusTone: 'original' | 'compatible' | 'incompatible';
  tacticalStatusLabelKey: string;
}
