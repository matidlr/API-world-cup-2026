import { MatchFormation } from '../model/match-formation.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export interface TacticalLineBoost {
  attack: number;
  defense: number;
  midfield: number;
}

export interface TacticalSnapshot {
  teamStrategy: MatchStrategy | null;
  teamFormation: MatchFormation | null;
  opponentStrategy: MatchStrategy | null;
  opponentFormation: MatchFormation | null;
  teamPenaltyPoints: number;
  opponentPenaltyPoints: number;
  teamLine: TacticalLineBoost;
  opponentLine: TacticalLineBoost;
}
