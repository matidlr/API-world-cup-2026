import { SquadTurnIncidentMessage } from '../helper/match-squad-rules.helper';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export interface TacticalLine {
  attack: number;
  defense: number;
  midfield: number;
}

export interface TeamTacticalState {
  strategy: MatchStrategy | null;
  formation: MatchFormation | null;
  lineBoost: TacticalLine;
  compatibilityPenaltyPoints: number;
  baseTeamLine: TacticalLine;
  effectiveTeamLine: TacticalLine;
}

export interface OpponentTacticalAdjustment {
  coachName: string;
  strategy: MatchStrategy;
  formation: MatchFormation;
  incidents: SquadTurnIncidentMessage[];
}
