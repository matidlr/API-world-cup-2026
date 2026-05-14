import { Injectable } from '@nestjs/common';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export interface CoachTacticalContext {
  phase: MatchCoachTacticalPhase;
  currentStrategy: MatchStrategy;
  opponentGoalDiff: number;
  remainingTurns: number;
  profile: CoachProfile;
  riskAppetite: number;
  gameManagement: number;
  adaptability: number;
  pressingBias: number;
  possessionBias: number;
  defenseBias: number;
}

/**
 * Resolves opponent tactical target strategy based on:
 * - score context
 * - match phase
 * - coach profile
 * - coach tactical attributes
 */
@Injectable()
export class MatchCoachTacticsHelper {
  /**
   * Returns null when no tactical change is recommended for this turn.
   */
  decideTargetStrategy(context: CoachTacticalContext): MatchStrategy | null {
    const candidates = this.buildCandidatePool(context);
    if (!candidates.length) {
      return null;
    }

    const preference = this.buildPreferenceTable(context);
    const sorted = [...candidates].sort((left, right) => preference[right] - preference[left]);
    const top = sorted[0];

    if (top === context.currentStrategy && sorted.length > 1) {
      return sorted[1];
    }

    if (top === context.currentStrategy) {
      return null;
    }

    return top;
  }

  /**
   * Picks the strategy candidates allowed for the current game situation.
   */
  private buildCandidatePool(context: CoachTacticalContext): MatchStrategy[] {
    const { phase, opponentGoalDiff } = context;

    if (phase === MatchCoachTacticalPhase.HALF_TIME) {
      if (opponentGoalDiff <= -2) {
        return [MatchStrategy.ATTACK, MatchStrategy.COUNTER_ATTACK, MatchStrategy.POSSESSION];
      }
      if (opponentGoalDiff === -1) {
        return [MatchStrategy.COUNTER_ATTACK, MatchStrategy.ATTACK, MatchStrategy.POSSESSION];
      }
      if (opponentGoalDiff === 0) {
        return [MatchStrategy.BALANCED, MatchStrategy.POSSESSION, MatchStrategy.COUNTER_ATTACK];
      }
      if (opponentGoalDiff === 1) {
        return [MatchStrategy.DEFENSE, MatchStrategy.POSSESSION, MatchStrategy.COUNTER_ATTACK];
      }

      return [MatchStrategy.DEFENSE, MatchStrategy.POSSESSION, MatchStrategy.COUNTER_ATTACK];
    }

    if (context.remainingTurns > 2) {
      return [];
    }

    if (opponentGoalDiff <= -2) {
      return [MatchStrategy.ATTACK, MatchStrategy.COUNTER_ATTACK];
    }
    if (opponentGoalDiff === -1) {
      return [MatchStrategy.ATTACK, MatchStrategy.COUNTER_ATTACK, MatchStrategy.POSSESSION];
    }
    if (opponentGoalDiff === 0) {
      return [MatchStrategy.ATTACK, MatchStrategy.BALANCED, MatchStrategy.POSSESSION];
    }
    if (opponentGoalDiff === 1) {
      return [MatchStrategy.DEFENSE, MatchStrategy.COUNTER_ATTACK, MatchStrategy.POSSESSION];
    }

    return [MatchStrategy.POSSESSION, MatchStrategy.COUNTER_ATTACK, MatchStrategy.DEFENSE];
  }

  /**
   * Builds preference scores for each strategy and adjusts them by coach profile.
   */
  private buildPreferenceTable(context: CoachTacticalContext): Record<MatchStrategy, number> {
    const risk = this.clamp01(context.riskAppetite);
    const management = this.clamp01(context.gameManagement);
    const adaptability = this.clamp01(context.adaptability);
    const pressing = this.clamp01(context.pressingBias);
    const possession = this.clamp01(context.possessionBias);
    const defense = this.clamp01(context.defenseBias);

    const scores: Record<MatchStrategy, number> = {
      [MatchStrategy.ATTACK]: risk * 0.55 + pressing * 0.25 + adaptability * 0.2,
      [MatchStrategy.DEFENSE]: defense * 0.55 + management * 0.3 + (1 - risk) * 0.15,
      [MatchStrategy.PENALTIES]: 0,
      [MatchStrategy.COUNTER_ATTACK]:
        pressing * 0.35 + risk * 0.3 + adaptability * 0.2 + (1 - possession) * 0.15,
      [MatchStrategy.BALANCED]: 0.5 + adaptability * 0.25 + management * 0.25,
      [MatchStrategy.POSSESSION]: possession * 0.55 + management * 0.25 + adaptability * 0.2,
    };

    this.applyProfileModifiers(scores, context.profile);
    this.applyScoreContextModifiers(scores, context);

    return scores;
  }

  /**
   * Applies profile identity adjustments so each coach profile behaves differently.
   */
  private applyProfileModifiers(
    scores: Record<MatchStrategy, number>,
    profile: CoachProfile,
  ): void {
    switch (profile) {
      case CoachProfile.CATENACCIO:
        scores[MatchStrategy.DEFENSE] += 0.3;
        scores[MatchStrategy.COUNTER_ATTACK] += 0.16;
        scores[MatchStrategy.ATTACK] -= 0.28;
        scores[MatchStrategy.POSSESSION] -= 0.08;
        break;
      case CoachProfile.CONSERVATIVE:
        scores[MatchStrategy.DEFENSE] += 0.2;
        scores[MatchStrategy.POSSESSION] += 0.1;
        scores[MatchStrategy.ATTACK] -= 0.2;
        break;
      case CoachProfile.AGGRESSIVE:
        scores[MatchStrategy.ATTACK] += 0.26;
        scores[MatchStrategy.COUNTER_ATTACK] += 0.14;
        scores[MatchStrategy.DEFENSE] -= 0.16;
        break;
      case CoachProfile.PRAGMATIC:
        scores[MatchStrategy.DEFENSE] += 0.1;
        scores[MatchStrategy.POSSESSION] += 0.1;
        scores[MatchStrategy.COUNTER_ATTACK] += 0.08;
        scores[MatchStrategy.BALANCED] += 0.1;
        break;
      case CoachProfile.REACTIVE:
        scores[MatchStrategy.COUNTER_ATTACK] += 0.16;
        scores[MatchStrategy.ATTACK] += 0.12;
        scores[MatchStrategy.BALANCED] += 0.08;
        break;
      case CoachProfile.TOTAL_FOOTBALL:
        scores[MatchStrategy.POSSESSION] += 0.24;
        scores[MatchStrategy.ATTACK] += 0.18;
        scores[MatchStrategy.COUNTER_ATTACK] += 0.08;
        scores[MatchStrategy.DEFENSE] -= 0.1;
        break;
      case CoachProfile.BALANCED:
      default:
        scores[MatchStrategy.BALANCED] += 0.08;
        break;
    }
  }

  /**
   * Applies score/phase modifiers to keep behavior coherent in key moments.
   */
  private applyScoreContextModifiers(
    scores: Record<MatchStrategy, number>,
    context: CoachTacticalContext,
  ): void {
    const { opponentGoalDiff, profile, phase, remainingTurns } = context;

    if (opponentGoalDiff > 0) {
      scores[MatchStrategy.DEFENSE] += 0.08;
      scores[MatchStrategy.POSSESSION] += 0.06;
    }

    if (opponentGoalDiff < 0) {
      scores[MatchStrategy.ATTACK] += 0.1;
      scores[MatchStrategy.COUNTER_ATTACK] += 0.06;
    }

    if (
      phase === MatchCoachTacticalPhase.LATE_GAME &&
      remainingTurns <= 2 &&
      opponentGoalDiff < 0
    ) {
      scores[MatchStrategy.ATTACK] += 0.12;
    }

    if (
      phase === MatchCoachTacticalPhase.LATE_GAME &&
      remainingTurns <= 2 &&
      opponentGoalDiff > 0
    ) {
      scores[MatchStrategy.DEFENSE] += 0.12;
    }

    if (profile === CoachProfile.AGGRESSIVE && opponentGoalDiff > 1) {
      scores[MatchStrategy.COUNTER_ATTACK] += 0.08;
      scores[MatchStrategy.DEFENSE] -= 0.05;
    }

    if (
      (profile === CoachProfile.CATENACCIO || profile === CoachProfile.CONSERVATIVE) &&
      opponentGoalDiff < 0 &&
      remainingTurns > 1
    ) {
      scores[MatchStrategy.COUNTER_ATTACK] += 0.12;
      scores[MatchStrategy.ATTACK] -= 0.08;
    }

    if (profile === CoachProfile.TOTAL_FOOTBALL && opponentGoalDiff > 1) {
      scores[MatchStrategy.POSSESSION] += 0.1;
      scores[MatchStrategy.DEFENSE] -= 0.04;
    }
  }

  /**
   * Normalizes coach rating values (0..100) into 0..1 range.
   */
  private clamp01(value: number): number {
    const safe = Number.isFinite(value) ? value : 50;
    return Math.min(1, Math.max(0, safe / 100));
  }
}
