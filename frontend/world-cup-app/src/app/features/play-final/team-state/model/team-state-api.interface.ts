export interface TeamStatePlayerApiItem {
  playerId: string;
  name: string;
  shirtNumber: number;
  position: string;
  age: number;
  energy: number;
  isCaptain: boolean;
  isStarter: boolean;
  isOnField: boolean;
  yellowCards: number;
  redCard: boolean;
  isInjured: boolean;
  positionTag: string;
  displayName: string;
  energyLabel: string;
  isBench: boolean;
}

export interface TeamStateTeamApiItem {
  id: string;
  name: string;
  flag: string;
  formation: string;
  strategy: string;
  strategyLabel: string;
  coachName: string;
  coachProfile: string;
  tactical: {
    attack: number;
    defense: number;
    midfield: number;
  };
  maxSubstitutions: number;
  substitutionsUsed: number;
  remainingSubstitutions: number;
  onFieldCount: number;
  onField: TeamStatePlayerApiItem[];
  bench: TeamStatePlayerApiItem[];
}

export interface TeamStateApiResponse {
  teamId: string;
  lang: 'es' | 'en';
  matchId: string;
  isActive: boolean;
  isFinished: boolean;
  minute: number;
  turn: number;
  score: string;
  team: TeamStateTeamApiItem;
  opponent: TeamStateTeamApiItem;
}
