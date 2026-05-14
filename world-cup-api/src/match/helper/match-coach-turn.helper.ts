import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { TeamsService } from 'src/teams/teams.service';
import { MatchEntity } from '../entity/match.entity';
import {
  ApplyOpponentTacticalAdjustmentParams,
  IsStrategyFormationCompatibleParams,
  MatchCoachTurnHelperContract,
  MaybeApplyOpponentTacticalAdjustmentParams,
  ResolveFormationForStrategyParams,
} from '../interfaces/match-coach-turn.interface';
import { OpponentTacticalAdjustment } from '../interfaces/match-team-tactical-state.interface';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import { MatchPersistenceHelper } from './match-persistence.helper';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchCoachTacticsHelper } from './match-coach-tactics.helper';
import {
  ALL_FORMATIONS,
  STRATEGY_COMPATIBILITY,
} from './match-tactical.config';
import { MAX_COACH_FORMATION_STYLE_STRICTNESS } from '../model/match-engine.constants';

@Injectable()
/**
 * Resolves coach-driven tactical adjustments per turn.
 */
export class MatchCoachTurnHelper implements MatchCoachTurnHelperContract {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly matchCoachTacticsHelper: MatchCoachTacticsHelper,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchPersistenceHelper: MatchPersistenceHelper,
    private readonly i18nService: I18nService,
  ) {}

  async maybeApplyOpponentTacticalAdjustment(
    input: MaybeApplyOpponentTacticalAdjustmentParams,
  ): Promise<OpponentTacticalAdjustment | null> {
    const { match, params, runtimeConfig } = input;
    if (
      runtimeConfig.opponentTacticsOnlySecondHalfEnabled &&
      params.phase === MatchCoachTacticalPhase.LATE_GAME &&
      params.minute < 46
    ) {
      return null;
    }

    const opponentCoach = await this.teamsService.getTeamCoachTacticalConfig(match.opponentId);
    const coachMaxChanges = Math.max(0, opponentCoach.maxStrategyChanges);
    const effectiveMaxChanges = Math.max(
      0,
      Math.min(runtimeConfig.opponentMaxStrategyChangesPerMatch, coachMaxChanges),
    );

    if ((match.opponentStrategyChangesUsed || 0) >= effectiveMaxChanges) {
      return null;
    }

    const lastChangeTurn = match.opponentLastTacticalChangeTurn || 0;
    if (
      lastChangeTurn > 0 &&
      runtimeConfig.opponentTacticsCooldownTurns > 0 &&
      match.turn - lastChangeTurn <= runtimeConfig.opponentTacticsCooldownTurns
    ) {
      return null;
    }

    const currentStrategy =
      this.matchTacticalHelper.parseStrategy(match.opponentStrategy) || MatchStrategy.BALANCED;
    const playedTurns = Math.max(0, match.turn - 1);
    const remainingTurns = Math.max(0, match.maxTurns - playedTurns);
    const targetStrategy = this.resolveOpponentTargetStrategy(match, params, currentStrategy, {
      profile: opponentCoach.profile,
      riskAppetite: opponentCoach.riskAppetite,
      gameManagement: opponentCoach.gameManagement,
      adaptability: opponentCoach.adaptability,
      pressingBias: opponentCoach.pressingBias,
      possessionBias: opponentCoach.possessionBias,
      defenseBias: opponentCoach.defenseBias,
      remainingTurns,
    });

    if (!targetStrategy || targetStrategy === currentStrategy) {
      return null;
    }

    const targetFormation = this.resolveFormationForStrategy({
      strategy: targetStrategy,
      currentFormationValue: match.opponentFormation,
      coachProfile: opponentCoach.profile,
      coachFormationStyleStrictness: runtimeConfig.coachFormationStyleStrictness,
    });

    match.opponentStrategy = targetStrategy;
    match.opponentFormation = targetFormation;
    match.opponentStrategyChangesUsed = (match.opponentStrategyChangesUsed || 0) + 1;
    match.opponentLastTacticalChangeTurn = match.turn;

    const incidents = await this.matchSquadRulesHelper.applyTacticalSubstitutionsForTeam(match, {
      teamId: match.opponentId,
      teamName: match.opponentName,
      strategy: targetStrategy,
      isUserTeam: false,
      minute: params.minute,
      eventType: params.eventType,
      maxChanges: 2,
    });

    const messageEn = this.i18nService.t('match.tactics.opponentShift', 'en', {
      coachName: opponentCoach.name,
      teamName: match.opponentName,
      strategy: targetStrategy,
      formation: targetFormation,
    });

    await this.matchPersistenceHelper.recordMatchStat({
      matchId: match.matchId,
      minute: params.minute,
      turn: match.turn,
      eventType: params.eventType,
      zone: (match.currentZone as MatchFieldZone) || null,
      action: null,
      teamId: match.opponentId,
      teamName: match.opponentName,
      playerName: null,
      playerPosition: null,
      cardType: null,
      isGoal: false,
      message: messageEn,
      messageKey: 'match.tactics.opponentShift',
      messageParams: {
        coachName: opponentCoach.name,
        teamName: match.opponentName,
        strategy: targetStrategy,
        formation: targetFormation,
      },
    });

    return {
      coachName: opponentCoach.name,
      strategy: targetStrategy,
      formation: targetFormation,
      incidents,
    };
  }

  resolveFormationForStrategy(params: ResolveFormationForStrategyParams): MatchFormation {
    const currentFormation = this.matchTacticalHelper.parseFormation(params.currentFormationValue);
    const compatibleFormations = STRATEGY_COMPATIBILITY[params.strategy];

    if (currentFormation && compatibleFormations.includes(currentFormation)) {
      return currentFormation;
    }

    if (!compatibleFormations.length) {
      return MatchFormation.F_4_4_2;
    }

    const strictness = params.coachFormationStyleStrictness / MAX_COACH_FORMATION_STYLE_STRICTNESS;
    const profile = (params.coachProfile as CoachProfile | null) || CoachProfile.BALANCED;

    const ranked = [...compatibleFormations].sort((left, right) => {
      const leftScore = this.resolveFormationCompositeScore(params.strategy, left, profile, strictness);
      const rightScore = this.resolveFormationCompositeScore(params.strategy, right, profile, strictness);
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return compatibleFormations.indexOf(left) - compatibleFormations.indexOf(right);
    });

    return ranked[0];
  }

  isStrategyFormationCompatible(params: IsStrategyFormationCompatibleParams): boolean {
    if (!params.formation) {
      return false;
    }

    return (STRATEGY_COMPATIBILITY[params.strategy] || []).includes(params.formation);
  }

  private resolveOpponentTargetStrategy(
    match: MatchEntity,
    params: ApplyOpponentTacticalAdjustmentParams,
    currentStrategy: MatchStrategy,
    coach: {
      profile: CoachProfile;
      riskAppetite: number;
      gameManagement: number;
      adaptability: number;
      pressingBias: number;
      possessionBias: number;
      defenseBias: number;
      remainingTurns: number;
    },
  ): MatchStrategy | null {
    const opponentGoalDiff = match.scoreOpponent - match.scoreTeam;
    return this.matchCoachTacticsHelper.decideTargetStrategy({
      phase: params.phase,
      currentStrategy,
      opponentGoalDiff,
      remainingTurns: coach.remainingTurns,
      profile: coach.profile,
      riskAppetite: coach.riskAppetite,
      gameManagement: coach.gameManagement,
      adaptability: coach.adaptability,
      pressingBias: coach.pressingBias,
      possessionBias: coach.possessionBias,
      defenseBias: coach.defenseBias,
    });
  }

  private resolveFormationCompositeScore(
    strategy: MatchStrategy,
    formation: MatchFormation,
    profile: CoachProfile,
    strictness: number,
  ): number {
    const contextScore = this.resolveStrategyFormationContextScore(strategy, formation);
    const styleScore = this.resolveCoachFormationStyleScore(profile, formation);
    return strictness * styleScore + (1 - strictness) * contextScore;
  }

  private resolveStrategyFormationContextScore(strategy: MatchStrategy, formation: MatchFormation): number {
    const ranked: Record<MatchStrategy, MatchFormation[]> = {
      [MatchStrategy.ATTACK]: [
        MatchFormation.F_4_3_3,
        MatchFormation.F_3_4_3,
        MatchFormation.F_4_3_1_2,
        MatchFormation.F_4_3_2_1,
      ],
      [MatchStrategy.DEFENSE]: [
        MatchFormation.F_5_4_1,
        MatchFormation.F_5_3_2,
        MatchFormation.F_4_5_1,
        MatchFormation.F_4_1_4_1,
        MatchFormation.F_4_4_2,
      ],
      [MatchStrategy.PENALTIES]: [
        MatchFormation.F_4_4_2,
        MatchFormation.F_4_1_4_1,
        MatchFormation.F_5_4_1,
        MatchFormation.F_4_2_3_1,
      ],
      [MatchStrategy.COUNTER_ATTACK]: [
        MatchFormation.F_4_4_2,
        MatchFormation.F_3_5_2,
        MatchFormation.F_3_4_1_2,
        MatchFormation.F_5_3_2,
      ],
      [MatchStrategy.BALANCED]: [
        MatchFormation.F_4_4_2,
        MatchFormation.F_4_2_3_1,
        MatchFormation.F_4_4_1_1,
        MatchFormation.F_4_1_4_1,
      ],
      [MatchStrategy.POSSESSION]: [
        MatchFormation.F_4_2_3_1,
        MatchFormation.F_4_3_3,
        MatchFormation.F_4_1_2_1_2,
        MatchFormation.F_4_3_1_2,
        MatchFormation.F_3_1_4_2,
      ],
    };

    const order = ranked[strategy];
    const index = order.indexOf(formation);
    if (index === -1) {
      return 0.5;
    }

    return Math.max(0.4, 1 - index * 0.1);
  }

  private resolveCoachFormationStyleScore(profile: CoachProfile, formation: MatchFormation): number {
    const rankedByProfile: Record<CoachProfile, MatchFormation[]> = {
      [CoachProfile.CONSERVATIVE]: [
        MatchFormation.F_5_4_1,
        MatchFormation.F_4_5_1,
        MatchFormation.F_4_1_4_1,
        MatchFormation.F_4_4_2,
      ],
      [CoachProfile.BALANCED]: [
        MatchFormation.F_4_4_2,
        MatchFormation.F_4_2_3_1,
        MatchFormation.F_4_4_1_1,
        MatchFormation.F_4_3_3,
      ],
      [CoachProfile.AGGRESSIVE]: [
        MatchFormation.F_4_3_3,
        MatchFormation.F_3_4_3,
        MatchFormation.F_4_3_1_2,
        MatchFormation.F_4_3_2_1,
      ],
      [CoachProfile.PRAGMATIC]: [
        MatchFormation.F_4_2_3_1,
        MatchFormation.F_4_4_2,
        MatchFormation.F_4_1_4_1,
        MatchFormation.F_5_3_2,
      ],
      [CoachProfile.CATENACCIO]: [
        MatchFormation.F_5_4_1,
        MatchFormation.F_5_3_2,
        MatchFormation.F_4_5_1,
        MatchFormation.F_4_1_4_1,
      ],
      [CoachProfile.REACTIVE]: [
        MatchFormation.F_4_4_2,
        MatchFormation.F_3_4_1_2,
        MatchFormation.F_3_5_2,
        MatchFormation.F_4_4_1_1,
      ],
      [CoachProfile.TOTAL_FOOTBALL]: [
        MatchFormation.F_4_3_3,
        MatchFormation.F_3_4_3,
        MatchFormation.F_4_2_3_1,
        MatchFormation.F_3_1_4_2,
      ],
    };

    const order = rankedByProfile[profile];
    const index = order.indexOf(formation);
    if (index === -1) {
      return 0.5;
    }

    return Math.max(0.4, 1 - index * 0.1);
  }
}
