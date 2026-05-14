import { MatchEntity } from '../entity/match.entity';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import { OpponentTacticalAdjustment } from './match-team-tactical-state.interface';

export interface MatchCoachRuntimeConfig {
  opponentTacticsOnlySecondHalfEnabled: boolean;
  opponentTacticsCooldownTurns: number;
  opponentMaxStrategyChangesPerMatch: number;
  coachFormationStyleStrictness: number;
}

export interface ApplyOpponentTacticalAdjustmentParams {
  phase: MatchCoachTacticalPhase;
  minute: number;
  eventType: MatchEventType;
}

export interface MaybeApplyOpponentTacticalAdjustmentParams {
  match: MatchEntity;
  params: ApplyOpponentTacticalAdjustmentParams;
  runtimeConfig: MatchCoachRuntimeConfig;
}

export interface ResolveFormationForStrategyParams {
  strategy: MatchStrategy;
  currentFormationValue: string | null;
  coachProfile?: string | null;
  coachFormationStyleStrictness: number;
}

export interface IsStrategyFormationCompatibleParams {
  strategy: MatchStrategy;
  formation: MatchFormation | null;
}

export interface MatchCoachTurnHelperContract {
  maybeApplyOpponentTacticalAdjustment(
    params: MaybeApplyOpponentTacticalAdjustmentParams,
  ): Promise<OpponentTacticalAdjustment | null>;
  resolveFormationForStrategy(params: ResolveFormationForStrategyParams): MatchFormation;
  isStrategyFormationCompatible(params: IsStrategyFormationCompatibleParams): boolean;
}
