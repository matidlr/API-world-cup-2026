export interface CoachingCoach {
  coachId: string;
  teamId: string;
  teamName: string;
  name: string;
  age: number;
  nationality: string;
  profile: string;
  profileLabel?: string;
  profileDescription?: string;
  riskAppetite: number;
  gameManagement: number;
  adaptability: number;
  pressingBias: number;
  possessionBias: number;
  defenseBias: number;
  maxStrategyChanges: number;
}

export interface CoachingTeamStrategy {
  teamId: string;
  strategy: string;
}

export interface CoachingTeamFormation {
  teamId: string;
  formation: string;
}

export interface CoachingTeamStats {
  attack: number;
  defense: number;
  midfield: number;
  overall: number;
  current_strategy: string;
  current_formation: string;
}

export interface CoachingStrategyCatalogItem {
  strategy: string;
  description: string;
  compatibleFormations: string[];
  strategyLineImpact?: CoachingStrategyLineImpact;
}

export interface CoachingStrategyLineImpact {
  attack: number;
  defense: number;
  midfield: number;
}

export interface CoachingFormationCatalogItem {
  formation: string;
  description: string;
  compatibleStrategies: string[];
}

export interface CoachingCompatibility {
  selectedStrategy: string;
  selectedFormation: string;
  compatibleFormations: string[];
  compatibleStrategies: string[];
  byStrategy: Record<string, string[]>;
  byFormation: Record<string, string[]>;
  isSelectedPairCompatible: boolean;
}

export interface CoachingTeamRatingItem {
  metric: string;
  value: number;
}

export interface CoachingTeamRatingDeltaItem {
  metric: string;
  strategyDelta: number;
  compatibilityPenalty: number;
  totalDelta: number;
}

export interface CoachingOverviewData {
  teamId: string;
  coach: CoachingCoach | null;
  strategy: CoachingTeamStrategy | null;
  formation: CoachingTeamFormation | null;
  stats: CoachingTeamStats | null;
  baseRatings: CoachingTeamRatingItem[];
  effectiveRatings: CoachingTeamRatingItem[];
  ratingDeltas: CoachingTeamRatingDeltaItem[];
  strategyPenalty: number;
  strategies: CoachingStrategyCatalogItem[];
  formations: CoachingFormationCatalogItem[];
  compatibility: CoachingCompatibility;
}
