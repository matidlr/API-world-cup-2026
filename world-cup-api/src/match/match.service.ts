import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService, TranslationParams } from 'src/i18n/i18n.service';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { TeamsService } from 'src/teams/teams.service';
import { WorldCupService } from 'src/world-cup/world-cup.service';
import { MatchSquadEntity } from './entity/match-squad.entity';
import { MatchStatEntity } from './entity/match-stat.entity';
import { MatchEntity } from './entity/match.entity';
import { MatchAction } from './model/match-action.enum';
import { MatchCardType } from './model/match-card-type.enum';
import { MatchEventType } from './model/match-event-type.enum';
import { MatchFieldZone } from './model/match-field-zone.enum';
import { MatchFormation } from './model/match-formation.enum';
import { MatchLanguage } from './model/match-language.model';
import { MatchResponse } from './model/match-response.model';
import { MatchLineupsResponse } from './model/match-lineups-response.model';
import { MatchMessageType } from './model/match-message-type.enum';
import { MatchSquadPlayer } from './model/match-squad-player.model';
import { MatchSquadResponse } from './model/match-squad-response.model';
import { MatchTeamLineup } from './model/match-team-lineup.model';
import { MatchTeamSquad } from './model/match-team-squad.model';
import { FormationCatalogItem } from './model/formation-catalog-item.model';
import { SelectFormationResponse } from './model/select-formation.response';
import { MatchStrategy } from './model/match-strategy.enum';
import { MatchStatItem } from './model/match-stat-item.model';
import { MatchStatsResponse } from './model/match-stats-response.model';
import { MatchStatsSummary } from './model/match-stats-summary.model';
import { ResetTeamTacticsResponse } from './model/reset-team-tactics.response';
import { SelectStrategyResponse } from './model/select-strategy.response';
import { StrategyCatalogItem } from './model/strategy-catalog-item.model';
import {
  ALL_FORMATIONS,
  ALL_STRATEGIES,
  STRATEGY_COMPATIBILITY,
} from './helper/match-tactical.config';
import { MatchTacticalHelper } from './helper/match-tactical.helper';
import { MatchEngine } from './helper/match-engine.helper';
import { MatchRuntimeConfigHelper } from './helper/match-runtime-config.helper';
import { MatchCoachTurnHelper } from './helper/match-coach-turn.helper';
import { MatchResponseMapperHelper } from './helper/match-response-mapper.helper';
import {
  TacticalLine,
  TeamTacticalState,
} from './interfaces/match-team-tactical-state.interface';
import { PlayRequest } from './request/play.request';
import { ResetTeamTacticsRequest } from './request/reset-team-tactics.request';
import { SelectFormationRequest } from './request/select-formation.request';
import { SelectStrategyRequest } from './request/select-strategy.request';
import { StartFinalRequest } from './request/start-final.request';
import {
  DEFAULT_MATCH_LANGUAGE,
  FULL_TEAM_LINEUP_SIZE,
  TECHNICAL_TIMELINE_EVENT_TYPES,
} from './model/match-engine.constants';

@Injectable()
/**
 * MatchService
 *
 * Responsibilities:
 * - Orchestrate the lifecycle of one active final.
 * - Resolve turn-by-turn gameplay based on option inputs (1..4), strategy, and controlled random events.
 * - Persist match state (`matches`) and event timeline (`match_stats`).
 *
 * Current engine capabilities:
 * - Final start with a single active match at a time.
 * - Team strategy/formation updates with compatibility-aware turn resolution.
 * - Turn narrative (`zone`, `possession`, `ballCarrier`).
 * - Goals with explicit scorer and opponent action narration.
 * - Yellow/red card events with position-based penalties.
 * - Forced no-draw closure at minute 90.
 * - Current/by-id match telemetry queries.
 *
 * Important rules:
 * - Option #4 is always `QUIT_MATCH`.
 * - Quitting immediately closes the active match as a forfeit.
 * - Finished matches expose `result` as `WIN` or `LOSS`.
 *
 * Design notes:
 * - Match engine complexity is centralized here so student BFFs can consume
 *   a stable and simple external API contract.
 */
export class MatchService {
  private readonly maxSubstitutionsPerTeam: number;
  private readonly autoAdjustFormationOnStrategyChange: boolean;
  private readonly coachFormationStyleStrictness: number;

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    @InjectRepository(MatchStatEntity)
    private readonly matchStatRepository: Repository<MatchStatEntity>,
    @InjectRepository(MatchSquadEntity)
    private readonly matchSquadRepository: Repository<MatchSquadEntity>,
    private readonly teamsService: TeamsService,
    private readonly i18nService: I18nService,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly matchEngine: MatchEngine,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchCoachTurnHelper: MatchCoachTurnHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
    private readonly worldCupService: WorldCupService,
  ) {
    this.maxSubstitutionsPerTeam = this.matchRuntimeConfigHelper.loadMaxSubstitutionsPerTeam();
    this.autoAdjustFormationOnStrategyChange =
      this.matchRuntimeConfigHelper.loadAutoAdjustFormationOnStrategyChange();
    this.coachFormationStyleStrictness = this.matchRuntimeConfigHelper.loadCoachFormationStyleStrictness();
  }

  /**
   * Returns strategy catalog for UI/backends, including compatibility guidance.
   */
  listStrategies(lang?: string): StrategyCatalogItem[] {
    const language = this.resolveLanguage(lang);

    return ALL_STRATEGIES.map((strategy) => ({
      strategy,
      description: this.i18nService.t(`match.strategy.description.${strategy}`, language),
      compatibleFormations: STRATEGY_COMPATIBILITY[strategy],
      strategyLineImpact: this.matchTacticalHelper.getStrategyLineImpact(strategy),
    }));
  }

  /**
   * Returns formation catalog for UI/backends, including compatibility guidance.
   */
  listFormations(lang?: string): FormationCatalogItem[] {
    const language = this.resolveLanguage(lang);

    return ALL_FORMATIONS.map((formation) => ({
      formation,
      description: this.i18nService.t(`match.formation.description.${formation}`, language),
      compatibleStrategies: ALL_STRATEGIES.filter((strategy) =>
        STRATEGY_COMPATIBILITY[strategy].includes(formation),
      ),
    }));
  }

  /**
   * Returns all available message item types for frontend rendering rules.
   */
  listMessageTypes(): MatchMessageType[] {
    return Object.values(MatchMessageType);
  }

  /**
   * Returns match ids for finished finals only, excluding any currently active final.
   * Ordered by newest first.
   */
  async listHistoricFinalIds(): Promise<string[]> {
    const rows = await this.matchRepository
      .createQueryBuilder('match')
      .select('match.matchId', 'matchId')
      .where('match.isFinished = :isFinished', { isFinished: true })
      .andWhere('match.isActive = :isActive', { isActive: false })
      .orderBy('match.creationDate', 'DESC')
      .getRawMany<{ matchId: string }>();

    return rows.map((row) => row.matchId);
  }

  /**
   * Starts a final match or returns the currently active one.
   * Initializes narrative fields (zone/possession/ball carrier) and logs kickoff in match_stats.
   */
  async startFinal(request: StartFinalRequest): Promise<MatchResponse> {
    return await this.matchEngine.startFinal(request);
  }

  /**
   * Persists strategy for a team. The match engine reads this value on each turn.
   */
  async selectStrategy(request: SelectStrategyRequest): Promise<SelectStrategyResponse> {
    const language = this.resolveLanguage(request.lang);
    const activeMatch = await this.findActiveMatchByTeam(request.teamId);
    const isUserTeamInActiveMatch = Boolean(activeMatch && activeMatch.teamId === request.teamId);
    const previousStrategy = activeMatch
      ? this.matchTacticalHelper.parseStrategy(
          isUserTeamInActiveMatch ? activeMatch.strategy : activeMatch.opponentStrategy,
        )
      : null;
    const previousFormation = activeMatch
      ? this.matchTacticalHelper.parseFormation(
          isUserTeamInActiveMatch ? activeMatch.formation : activeMatch.opponentFormation,
        )
      : null;

    const teamStrategy = await this.teamsService.setTeamStrategy(request.teamId, request.strategy);
    const currentFormation = await this.teamsService.getTeamFormationValue(teamStrategy.teamId);
    const teamCoach = await this.teamsService.getTeamCoachTacticalConfig(teamStrategy.teamId);

    let resolvedFormation: MatchFormation | null = currentFormation;
    let formationAutoAdjusted = false;

    if (
      this.autoAdjustFormationOnStrategyChange &&
      currentFormation &&
      !this.isStrategyFormationCompatible(teamStrategy.strategy, currentFormation)
    ) {
      const targetFormation = this.resolveFormationForStrategy(
        teamStrategy.strategy,
        currentFormation,
        teamCoach.profile,
      );
      if (targetFormation !== currentFormation) {
        const savedFormation = await this.teamsService.setTeamFormation(
          teamStrategy.teamId,
          targetFormation,
        );
        resolvedFormation = savedFormation.formation;
        formationAutoAdjusted = true;
      } else {
        resolvedFormation = targetFormation;
      }
    }

    const nextStrategy = teamStrategy.strategy;
    const nextFormation = resolvedFormation;

    if (activeMatch) {
      const syncedMatch = await this.syncActiveMatchTeamTactics({
        activeMatch,
        teamId: request.teamId,
        strategy: nextStrategy,
        formation: nextFormation,
      });

      if (
        isUserTeamInActiveMatch &&
        this.hasTacticalShift(previousStrategy, previousFormation, nextStrategy, nextFormation)
      ) {
        await this.recordImmediateUserTacticalShift({
          match: syncedMatch,
          previousStrategy,
          previousFormation,
          strategy: nextStrategy,
          formation: nextFormation,
          language,
        });
      }
    }

    return {
      teamId: teamStrategy.teamId,
      strategy: teamStrategy.strategy,
      formation: resolvedFormation,
      formationAutoAdjusted,
      message: this.i18nService.t(
        formationAutoAdjusted ? 'match.strategy.saved.autoFormation' : 'match.strategy.saved',
        language,
        {
          strategy: teamStrategy.strategy,
          formation: resolvedFormation || '-',
        },
      ),
    };
  }

  /**
   * Persists formation for a team. The match engine reads this value on each turn.
   */
  async selectFormation(request: SelectFormationRequest): Promise<SelectFormationResponse> {
    const language = this.resolveLanguage(request.lang);
    const activeMatch = await this.findActiveMatchByTeam(request.teamId);
    const isUserTeamInActiveMatch = Boolean(activeMatch && activeMatch.teamId === request.teamId);
    const previousStrategy = activeMatch
      ? this.matchTacticalHelper.parseStrategy(
          isUserTeamInActiveMatch ? activeMatch.strategy : activeMatch.opponentStrategy,
        )
      : null;
    const previousFormation = activeMatch
      ? this.matchTacticalHelper.parseFormation(
          isUserTeamInActiveMatch ? activeMatch.formation : activeMatch.opponentFormation,
        )
      : null;

    const teamFormation = await this.teamsService.setTeamFormation(request.teamId, request.formation);
    const currentStrategy = await this.teamsService.getTeamStrategyValue(request.teamId);

    if (activeMatch) {
      const syncedMatch = await this.syncActiveMatchTeamTactics({
        activeMatch,
        teamId: request.teamId,
        strategy: currentStrategy,
        formation: teamFormation.formation,
      });

      if (
        isUserTeamInActiveMatch &&
        this.hasTacticalShift(
          previousStrategy,
          previousFormation,
          currentStrategy,
          teamFormation.formation,
        )
      ) {
        await this.recordImmediateUserTacticalShift({
          match: syncedMatch,
          previousStrategy,
          previousFormation,
          strategy: currentStrategy,
          formation: teamFormation.formation,
          language,
        });
      }
    }

    return {
      teamId: teamFormation.teamId,
      formation: teamFormation.formation,
      message: this.i18nService.t('match.formation.saved', language, {
        formation: teamFormation.formation,
      }),
    };
  }

  /**
   * Restores strategy and formation to the default values for the selected team.
   */
  async resetTeamTacticsToDefault(
    request: ResetTeamTacticsRequest,
  ): Promise<ResetTeamTacticsResponse> {
    const defaultTactics = await this.teamsService.resetTeamTacticsToDefault(request.teamId);

    return {
      teamId: defaultTactics.teamId,
      strategy: defaultTactics.strategy,
      formation: defaultTactics.formation,
      message: this.i18nService.t('match.tactics.reset', 'en', {
        strategy: defaultTactics.strategy,
        formation: defaultTactics.formation,
      }),
    };
  }

  /**
   * Facade method for one match turn.
   * Delegates the full turn pipeline to MatchEngine.
   */
  async play(request: PlayRequest): Promise<MatchResponse> {
    return await this.matchEngine.play(request);
  }

  /**
   * Returns aggregated timeline and summary for the current active match.
   */
  async getCurrentMatchStats(lang?: string): Promise<MatchStatsResponse> {
    const language = this.resolveLanguage(lang);
    const activeMatch = await this.getCurrentOrLatestWorldCupFinalMatch();

    return this.buildMatchStatsResponse(activeMatch, language);
  }

  /**
   * Returns squad state (starters, bench, player live stats) for the current active match.
   */
  async getCurrentMatchSquad(): Promise<MatchSquadResponse> {
    const activeMatch = await this.getCurrentOrLatestWorldCupFinalMatch();

    return this.buildMatchSquadResponse(activeMatch);
  }

  /**
   * Returns only current on-field players for both teams in the active match.
   */
  async getCurrentMatchLineups(): Promise<MatchLineupsResponse> {
    const activeMatch = await this.getCurrentOrLatestWorldCupFinalMatch();

    return this.buildMatchLineupsResponse(activeMatch);
  }

  /**
   * Returns the active final match when present.
   * If no active final exists, falls back to the latest final linked to current world cup.
   */
  private async getCurrentOrLatestWorldCupFinalMatch(): Promise<MatchEntity> {
    const activeMatch = await this.matchRepository.findOne({
      where: { isActive: true, isFinished: false },
      order: { creationDate: 'DESC' },
    });
    if (activeMatch) {
      return activeMatch;
    }

    try {
      const currentWorldCup = await this.worldCupService.getCurrentWorldCup();
      const finalMatchId = currentWorldCup.finalMatchId?.trim();
      if (finalMatchId) {
        const finalMatch = await this.matchRepository.findOne({ where: { matchId: finalMatchId } });
        if (finalMatch) {
          return finalMatch;
        }
      }
    } catch {
      // No current world cup available.
    }

    throw new NotFoundException(ApiErrorCode.ACTIVE_FINAL_NOT_FOUND);
  }

  private async findActiveMatchByTeam(teamId: string): Promise<MatchEntity | null> {
    const normalizedTeamId = teamId.trim().toLowerCase();
    return await this.matchRepository
      .createQueryBuilder('match')
      .where('match.isActive = :isActive', { isActive: true })
      .andWhere('match.isFinished = :isFinished', { isFinished: false })
      .andWhere('(match.teamId = :teamId OR match.opponentId = :teamId)', {
        teamId: normalizedTeamId,
      })
      .orderBy('match.creationDate', 'DESC')
      .getOne();
  }

  private async syncActiveMatchTeamTactics(params: {
    activeMatch: MatchEntity;
    teamId: string;
    strategy: MatchStrategy | null;
    formation: MatchFormation | null;
  }): Promise<MatchEntity> {
    const { activeMatch, teamId, strategy, formation } = params;
    const normalizedTeamId = teamId.trim().toLowerCase();
    if (activeMatch.teamId === normalizedTeamId) {
      activeMatch.strategy = strategy;
      activeMatch.formation = formation;
    } else if (activeMatch.opponentId === normalizedTeamId) {
      activeMatch.opponentStrategy = strategy;
      activeMatch.opponentFormation = formation;
    }

    return await this.matchRepository.save(activeMatch);
  }

  private hasTacticalShift(
    previousStrategy: MatchStrategy | null,
    previousFormation: MatchFormation | null,
    strategy: MatchStrategy | null,
    formation: MatchFormation | null,
  ): boolean {
    if (!strategy || !formation) {
      return false;
    }
    return previousStrategy !== strategy || previousFormation !== formation;
  }

  private async recordImmediateUserTacticalShift(params: {
    match: MatchEntity;
    previousStrategy: MatchStrategy | null;
    previousFormation: MatchFormation | null;
    strategy: MatchStrategy;
    formation: MatchFormation;
    language: MatchLanguage;
  }): Promise<void> {
    const { match, previousStrategy, previousFormation, strategy, formation, language } = params;
    const messageKey = this.resolveUserTacticalShiftMessageKey(strategy);
    const messageParams: TranslationParams = {
      teamName: match.teamName,
      coachName: match.teamCoachName || match.teamName,
      strategy,
      formation,
      previousStrategy: previousStrategy || strategy,
      previousFormation: previousFormation || formation,
    };

    const stat = this.matchStatRepository.create({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType: match.eventType || MatchEventType.BALL_POSSESSION_EVENT,
      zone: match.currentZone || null,
      action: null,
      teamId: match.teamId,
      teamName: match.teamName,
      playerId: null,
      playerName: null,
      playerPosition: null,
      cardType: null,
      isGoal: false,
      messageKey,
      messageParamsJson: JSON.stringify(messageParams),
      message: this.i18nService.t(messageKey, language, messageParams),
    });

    await this.matchStatRepository.save(stat);
  }

  private resolveUserTacticalShiftMessageKey(strategy: MatchStrategy): string {
    const variantKey = `match.tactics.userShift.${strategy}.${this.randomInt(1, 2)}`;
    const variantExists =
      this.i18nService.t(variantKey, 'en') !== variantKey &&
      this.i18nService.t(variantKey, 'es') !== variantKey;
    return variantExists ? variantKey : 'match.tactics.userShift';
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Returns aggregated timeline and summary for any match by id.
   */
  async getMatchStatsById(matchId: string, lang?: string): Promise<MatchStatsResponse> {
    const language = this.resolveLanguage(lang);
    const normalizedMatchId = matchId.trim();
    const match = await this.matchRepository.findOne({ where: { matchId: normalizedMatchId } });

    if (!match) {
      throw new NotFoundException(ApiErrorCode.MATCH_NOT_FOUND);
    }

    return this.buildMatchStatsResponse(match, language);
  }

  /**
   * Returns squad state (starters, bench, player live stats) for any match by id.
   */
  async getMatchSquadById(matchId: string): Promise<MatchSquadResponse> {
    const normalizedMatchId = matchId.trim();
    const match = await this.matchRepository.findOne({ where: { matchId: normalizedMatchId } });

    if (!match) {
      throw new NotFoundException(ApiErrorCode.MATCH_NOT_FOUND);
    }

    return this.buildMatchSquadResponse(match);
  }

  /**
   * Returns only current on-field players for both teams in the selected match.
   */
  async getMatchLineupsById(matchId: string): Promise<MatchLineupsResponse> {
    const normalizedMatchId = matchId.trim();
    const match = await this.matchRepository.findOne({ where: { matchId: normalizedMatchId } });

    if (!match) {
      throw new NotFoundException(ApiErrorCode.MATCH_NOT_FOUND);
    }

    return this.buildMatchLineupsResponse(match);
  }

  /**
   * Picks a compatible formation for a strategy, preferring current shape when compatible.
   * When a switch is required, it blends coach style and tactical context:
   * - style weight = COACH_FORMATION_STYLE_STRICTNESS / 10
   * - context weight = 1 - style weight
   */
  private resolveFormationForStrategy(
    strategy: MatchStrategy,
    currentFormationValue: string | null,
    coachProfile: CoachProfile | null = null,
  ): MatchFormation {
    return this.matchCoachTurnHelper.resolveFormationForStrategy({
      strategy,
      currentFormationValue,
      coachProfile,
      coachFormationStyleStrictness: this.coachFormationStyleStrictness,
    });
  }

  /**
   * Checks whether a strategy and formation pair is compatible.
   */
  private isStrategyFormationCompatible(
    strategy: MatchStrategy,
    formation: MatchFormation | null,
  ): boolean {
    return this.matchCoachTurnHelper.isStrategyFormationCompatible({ strategy, formation });
  }

  /**
   * Builds match stats API payload with timeline and summary.
   */
  private async buildMatchStatsResponse(
    match: MatchEntity,
    language: MatchLanguage = DEFAULT_MATCH_LANGUAGE,
  ): Promise<MatchStatsResponse> {
    const coachMetadata = await this.resolveCoachMetadata(match);
    const stats = await this.matchStatRepository.find({
      where: { matchId: match.matchId },
      order: { turn: 'ASC', creationDate: 'ASC' },
    });

    const normalizedStats = this.normalizeTimelineStats(stats, match);
    const events = normalizedStats.map((stat) => this.toMatchStatItem(stat, language, match));
    const summary = this.buildSummary(match, events);

    return {
      matchId: match.matchId,
      isActive: match.isActive,
      isFinished: match.isFinished,
      minute: match.minute,
      turn: match.turn,
      score: `${match.scoreTeam}-${match.scoreOpponent}`,
      team: {
        id: match.teamId,
        name: match.teamName,
        strategy: this.matchTacticalHelper.parseStrategy(match.strategy),
        formation: this.matchTacticalHelper.parseFormation(match.formation),
        coachName: coachMetadata.teamCoachName,
        coachProfile: coachMetadata.teamCoachProfile,
      },
      opponent: {
        id: match.opponentId,
        name: match.opponentName,
        strategy: this.matchTacticalHelper.parseStrategy(match.opponentStrategy),
        formation: this.matchTacticalHelper.parseFormation(match.opponentFormation),
        coachName: coachMetadata.opponentCoachName,
        coachProfile: coachMetadata.opponentCoachProfile,
      },
      summary,
      events,
    };
  }

  /**
   * Reduces noisy duplicate technical timeline rows while preserving gameplay incidents.
   */
  private normalizeTimelineStats(stats: MatchStatEntity[], match: MatchEntity): MatchStatEntity[] {
    const dedupedTechnicalByKey = new Map<string, MatchStatEntity>();
    const technicalOrder: string[] = [];
    const passthrough: MatchStatEntity[] = [];

    for (const stat of stats) {
      const eventType = stat.eventType as MatchEventType;
      const isTechnical = TECHNICAL_TIMELINE_EVENT_TYPES.has(eventType);
      const isCanonicalTechnical = isTechnical && this.isCanonicalTechnicalTimelineMessage(stat, match);

      if (!isCanonicalTechnical) {
        passthrough.push(stat);
        continue;
      }

      const key = [
        stat.turn,
        stat.minute,
        stat.eventType,
        stat.teamId || '',
        stat.teamName || '',
        stat.cardType || '',
        stat.isGoal ? '1' : '0',
      ].join('|');

      const previous = dedupedTechnicalByKey.get(key);
      if (!previous) {
        dedupedTechnicalByKey.set(key, stat);
        technicalOrder.push(key);
        continue;
      }

      if (this.scoreStatRichness(stat) > this.scoreStatRichness(previous)) {
        dedupedTechnicalByKey.set(key, stat);
      }
    }

    const technicalRows = technicalOrder
      .map((key) => dedupedTechnicalByKey.get(key))
      .filter((stat): stat is MatchStatEntity => Boolean(stat));

    return [...passthrough, ...technicalRows].sort((a, b) => {
      if (a.turn !== b.turn) {
        return a.turn - b.turn;
      }

      if (a.minute !== b.minute) {
        return a.minute - b.minute;
      }

      return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
    });
  }

  /**
   * Keeps the most descriptive technical row when duplicates share the same key.
   */
  private scoreStatRichness(stat: MatchStatEntity): number {
    let score = 0;
    if (stat.playerName) {
      score += 2;
    }
    if (stat.action) {
      score += 1;
    }
    if (stat.zone) {
      score += 1;
    }
    return score;
  }

  /**
   * Builds match squad API payload with formations, starters, bench and player live stats.
   */
  private async buildMatchSquadResponse(match: MatchEntity): Promise<MatchSquadResponse> {
    const coachMetadata = await this.resolveCoachMetadata(match);
    const squadRows = await this.matchSquadRepository.find({
      where: { matchId: match.matchId },
      order: { isOnField: 'DESC', isStarter: 'DESC', position: 'ASC', playerName: 'ASC' },
    });

    const teamRows = squadRows.filter((row) => row.teamId === match.teamId);
    const opponentRows = squadRows.filter((row) => row.teamId === match.opponentId);
    const tacticalState = await this.resolveMatchTacticalState(match);

    return {
      matchId: match.matchId,
      isActive: match.isActive,
      isFinished: match.isFinished,
      minute: match.minute,
      turn: match.turn,
      score: `${match.scoreTeam}-${match.scoreOpponent}`,
      team: this.buildTeamSquadModel({
        teamId: match.teamId,
        teamName: match.teamName,
        coachName: coachMetadata.teamCoachName,
        coachProfile: coachMetadata.teamCoachProfile,
        formation: tacticalState.teamFormation,
        strategy: tacticalState.teamStrategy,
        maxSubstitutions: match.maxSubstitutions || this.maxSubstitutionsPerTeam,
        substitutionsUsed: match.teamSubstitutionsUsed || 0,
        rows: teamRows,
      }),
      opponent: this.buildTeamSquadModel({
        teamId: match.opponentId,
        teamName: match.opponentName,
        coachName: coachMetadata.opponentCoachName,
        coachProfile: coachMetadata.opponentCoachProfile,
        formation: tacticalState.opponentFormation,
        strategy: tacticalState.opponentStrategy,
        maxSubstitutions: match.maxSubstitutions || this.maxSubstitutionsPerTeam,
        substitutionsUsed: match.opponentSubstitutionsUsed || 0,
        rows: opponentRows,
      }),
    };
  }

  /**
   * Builds lightweight lineups payload with only current on-field players for both teams.
   */
  private async buildMatchLineupsResponse(match: MatchEntity): Promise<MatchLineupsResponse> {
    const squadRows = await this.matchSquadRepository.find({
      where: { matchId: match.matchId },
      order: { isOnField: 'DESC', isStarter: 'DESC', position: 'ASC', playerName: 'ASC' },
    });

    const teamRows = squadRows.filter((row) => row.teamId === match.teamId);
    const opponentRows = squadRows.filter((row) => row.teamId === match.opponentId);
    const tacticalState = await this.resolveMatchTacticalState(match);

    return {
      matchId: match.matchId,
      isActive: match.isActive,
      isFinished: match.isFinished,
      minute: match.minute,
      turn: match.turn,
      score: `${match.scoreTeam}-${match.scoreOpponent}`,
      team: this.buildTeamLineupModel({
        teamId: match.teamId,
        teamName: match.teamName,
        formation: tacticalState.teamFormation,
        strategy: tacticalState.teamStrategy,
        rows: teamRows,
      }),
      opponent: this.buildTeamLineupModel({
        teamId: match.opponentId,
        teamName: match.opponentName,
        formation: tacticalState.opponentFormation,
        strategy: tacticalState.opponentStrategy,
        rows: opponentRows,
      }),
    };
  }

  /**
   * Maps match_squad rows into API team section.
   */
  private buildTeamSquadModel(params: {
    teamId: string;
    teamName: string;
    coachName: string | null;
    coachProfile: CoachProfile | null;
    formation: MatchFormation | null;
    strategy: MatchStrategy | null;
    maxSubstitutions: number;
    substitutionsUsed: number;
    rows: MatchSquadEntity[];
  }): MatchTeamSquad {
    const tacticalState = this.buildTeamTacticalState(params.rows, params.strategy, params.formation);
    const players = params.rows.map((row) => this.toMatchSquadPlayer(row, tacticalState));
    const starters = players.filter((player) => player.isStarter);
    const onField = players.filter((player) => player.isOnField);
    const bench = players.filter((player) => !player.isOnField);

    const remainingSubstitutions = Math.max(0, params.maxSubstitutions - params.substitutionsUsed);

    return {
      id: params.teamId,
      name: params.teamName,
      formation: params.formation,
      strategy: params.strategy,
      coachName: params.coachName,
      coachProfile: params.coachProfile,
      tacticalBreakdown: {
        baseTeamLine: tacticalState.baseTeamLine,
        lineBoost: tacticalState.lineBoost,
        compatibilityPenaltyPoints: tacticalState.compatibilityPenaltyPoints,
        effectiveTeamLine: tacticalState.effectiveTeamLine,
      },
      maxSubstitutions: params.maxSubstitutions,
      substitutionsUsed: params.substitutionsUsed,
      remainingSubstitutions,
      onFieldCount: onField.length,
      starters,
      onField,
      bench,
    };
  }

  /**
   * Resolves coach names/profiles for both teams in one place, with safe fallback to persisted match names.
   */
  private async resolveCoachMetadata(match: MatchEntity): Promise<{
    teamCoachName: string | null;
    teamCoachProfile: CoachProfile | null;
    opponentCoachName: string | null;
    opponentCoachProfile: CoachProfile | null;
  }> {
    try {
      const [teamCoach, opponentCoach] = await Promise.all([
        this.teamsService.getTeamCoachIdentity(match.teamId),
        this.teamsService.getTeamCoachIdentity(match.opponentId),
      ]);

      return {
        teamCoachName: teamCoach.name || match.teamCoachName || null,
        teamCoachProfile: teamCoach.profile,
        opponentCoachName: opponentCoach.name || match.opponentCoachName || null,
        opponentCoachProfile: opponentCoach.profile,
      };
    } catch {
      return {
        teamCoachName: match.teamCoachName || null,
        teamCoachProfile: null,
        opponentCoachName: match.opponentCoachName || null,
        opponentCoachProfile: null,
      };
    }
  }

  /**
   * Maps match_squad rows into a lightweight lineup section (only current on-field players).
   */
  private buildTeamLineupModel(params: {
    teamId: string;
    teamName: string;
    formation: MatchFormation | null;
    strategy: MatchStrategy | null;
    rows: MatchSquadEntity[];
  }): MatchTeamLineup {
    const tacticalState = this.buildTeamTacticalState(params.rows, params.strategy, params.formation);
    const players = params.rows.map((row) => this.toMatchSquadPlayer(row, tacticalState));
    const onField = players.filter((player) => player.isOnField);

    return {
      id: params.teamId,
      name: params.teamName,
      formation: params.formation,
      onFieldCount: onField.length,
      onField,
    };
  }

  /**
   * Maps one match_squad row into the public squad player model.
   */
  private toMatchSquadPlayer(entity: MatchSquadEntity, tacticalState: TeamTacticalState): MatchSquadPlayer {
    const strategyImpact = this.buildPlayerStrategyImpact(
      entity.position,
      tacticalState.lineBoost,
      tacticalState.compatibilityPenaltyPoints,
    );
    const energyModifier = this.resolveEnergyModifier(entity.energy);
    const effectiveStats = {
      skill: this.clampPlayerStat((entity.skill + strategyImpact.skillDelta) * energyModifier),
      attack: this.clampPlayerStat((entity.attack + strategyImpact.attackDelta) * energyModifier),
      defense: this.clampPlayerStat((entity.defense + strategyImpact.defenseDelta) * energyModifier),
    };

    return {
      playerId: entity.playerId,
      name: entity.playerName,
      position: entity.position,
      shirtNumber: entity.shirtNumber,
      age: entity.age,
      skill: entity.skill,
      attack: entity.attack,
      defense: entity.defense,
      energy: entity.energy,
      isCaptain: entity.isCaptain,
      isStarter: entity.isStarter,
      isOnField: entity.isOnField,
      yellowCards: entity.yellowCards,
      redCard: entity.redCard,
      isInjured: entity.isInjured,
      strategyImpact,
      energyModifier,
      effectiveStats,
    };
  }

  /**
   * Resolves tactical setup for squad payloads.
   * For active matches, reads current strategy/formation from teams so changes are visible immediately.
   */
  private async resolveMatchTacticalState(match: MatchEntity): Promise<{
    teamStrategy: MatchStrategy | null;
    teamFormation: MatchFormation | null;
    opponentStrategy: MatchStrategy | null;
    opponentFormation: MatchFormation | null;
  }> {
    let teamStrategy = this.matchTacticalHelper.parseStrategy(match.strategy);
    let teamFormation = this.matchTacticalHelper.parseFormation(match.formation);
    let opponentStrategy = this.matchTacticalHelper.parseStrategy(match.opponentStrategy);
    let opponentFormation = this.matchTacticalHelper.parseFormation(match.opponentFormation);

    if (match.isActive && !match.isFinished) {
      const [
        currentTeamStrategy,
        currentTeamFormation,
        currentOpponentStrategy,
        currentOpponentFormation,
      ] = await Promise.all([
        this.teamsService.getTeamStrategyValue(match.teamId),
        this.teamsService.getTeamFormationValue(match.teamId),
        this.teamsService.getTeamStrategyValue(match.opponentId),
        this.teamsService.getTeamFormationValue(match.opponentId),
      ]);

      teamStrategy = currentTeamStrategy;
      teamFormation = currentTeamFormation;
      opponentStrategy = currentOpponentStrategy;
      opponentFormation = currentOpponentFormation;
    }

    return {
      teamStrategy,
      teamFormation,
      opponentStrategy,
      opponentFormation,
    };
  }

  /**
   * Builds tactical line breakdown for one team using current on-field players.
   */
  private buildTeamTacticalState(
    rows: MatchSquadEntity[],
    strategy: MatchStrategy | null,
    formation: MatchFormation | null,
  ): TeamTacticalState {
    const onFieldRows = rows.filter((row) => row.isOnField);
    const baseTeamLine = this.buildBaseTeamLine(onFieldRows);
    const tacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
      strategy,
      formation,
      opponentStrategy: null,
      opponentFormation: null,
    });
    const lineBoost = tacticalSnapshot.teamLine;
    const compatibilityPenaltyPoints = tacticalSnapshot.teamPenaltyPoints;
    const effectiveTeamLine = {
      attack: this.clampPlayerStat(baseTeamLine.attack + lineBoost.attack - compatibilityPenaltyPoints),
      defense: this.clampPlayerStat(baseTeamLine.defense + lineBoost.defense - compatibilityPenaltyPoints),
      midfield: this.clampPlayerStat(baseTeamLine.midfield + lineBoost.midfield - compatibilityPenaltyPoints),
    };

    return {
      strategy,
      formation,
      lineBoost,
      compatibilityPenaltyPoints,
      baseTeamLine,
      effectiveTeamLine,
    };
  }

  /**
   * Builds base line strengths from live on-field squad values.
   */
  private buildBaseTeamLine(onFieldRows: MatchSquadEntity[]): TacticalLine {
    if (!onFieldRows.length) {
      return { attack: 60, defense: 60, midfield: 60 };
    }

    const midfieldRows = onFieldRows.filter((row) => row.position === 'MF');
    const midfieldSource = midfieldRows.length ? midfieldRows : onFieldRows;
    const availabilityFactor = Math.min(1, onFieldRows.length / FULL_TEAM_LINEUP_SIZE);

    return {
      attack: Math.round(this.averageStat(onFieldRows, 'attack') * availabilityFactor),
      defense: Math.round(this.averageStat(onFieldRows, 'defense') * availabilityFactor),
      midfield: Math.round(this.averageStat(midfieldSource, 'skill') * availabilityFactor),
    };
  }

  /**
   * Computes tactical deltas applied to one player from strategy and compatibility penalty.
   */
  private buildPlayerStrategyImpact(
    position: string,
    lineBoost: TacticalLine,
    compatibilityPenaltyPoints: number,
  ): { attackDelta: number; defenseDelta: number; skillDelta: number } {
    const normalizedPosition = position.toUpperCase();
    const attackWeight = this.getPositionWeight(normalizedPosition, 'attack');
    const defenseWeight = this.getPositionWeight(normalizedPosition, 'defense');
    const skillWeight = this.getPositionWeight(normalizedPosition, 'skill');

    return {
      attackDelta: Math.round(lineBoost.attack * attackWeight - compatibilityPenaltyPoints * attackWeight),
      defenseDelta: Math.round(lineBoost.defense * defenseWeight - compatibilityPenaltyPoints * defenseWeight),
      skillDelta: Math.round(lineBoost.midfield * skillWeight - compatibilityPenaltyPoints * skillWeight),
    };
  }

  /**
   * Returns energy-based multiplier used for effective player stats.
   */
  private resolveEnergyModifier(energy: number): number {
    if (energy >= 70) {
      return 1;
    }

    if (energy >= 60) {
      return 0.95;
    }

    if (energy >= 50) {
      return 0.9;
    }

    if (energy >= 40) {
      return 0.82;
    }

    if (energy >= 30) {
      return 0.72;
    }

    return 0.6;
  }

  /**
   * Utility: average one numeric squad field rounded to nearest integer.
   */
  private averageStat(rows: MatchSquadEntity[], field: 'attack' | 'defense' | 'skill'): number {
    const sum = rows.reduce((acc, row) => acc + row[field], 0);
    return Math.round(sum / Math.max(1, rows.length));
  }

  /**
   * Utility: per-position weights for tactical deltas.
   */
  private getPositionWeight(position: string, line: 'attack' | 'defense' | 'skill'): number {
    if (line === 'attack') {
      if (position === 'FW') return 1;
      if (position === 'MF') return 0.65;
      if (position === 'DF') return 0.35;
      if (position === 'GK') return 0.1;
      return 0.5;
    }

    if (line === 'defense') {
      if (position === 'DF') return 1;
      if (position === 'MF') return 0.65;
      if (position === 'FW') return 0.3;
      if (position === 'GK') return 1.1;
      return 0.5;
    }

    if (position === 'MF') return 1;
    if (position === 'FW') return 0.55;
    if (position === 'DF') return 0.45;
    if (position === 'GK') return 0.35;
    return 0.5;
  }

  /**
   * Utility: clamps any computed player stat into engine-safe range.
   */
  private clampPlayerStat(value: number): number {
    return Math.max(1, Math.min(99, Math.round(value)));
  }

  /**
   * Builds card/goal counters from match and timeline data.
   */
  private buildSummary(match: MatchEntity, events: MatchStatItem[]): MatchStatsSummary {
    const teamGoals = match.scoreTeam;
    const opponentGoals = match.scoreOpponent;

    const teamYellowCards = events.filter(
      (event) => event.cardType === MatchCardType.YELLOW && event.teamId === match.teamId,
    ).length;
    const teamRedCards = events.filter(
      (event) => event.cardType === MatchCardType.RED && event.teamId === match.teamId,
    ).length;

    const opponentYellowCards = events.filter(
      (event) => event.cardType === MatchCardType.YELLOW && event.teamId === match.opponentId,
    ).length;
    const opponentRedCards = events.filter(
      (event) => event.cardType === MatchCardType.RED && event.teamId === match.opponentId,
    ).length;

    return {
      teamGoals,
      opponentGoals,
      teamYellowCards,
      teamRedCards,
      opponentYellowCards,
      opponentRedCards,
    };
  }

  /**
   * Maps persisted stat entity into API timeline item.
   */
  private toMatchStatItem(
    stat: MatchStatEntity,
    language: MatchLanguage,
    match: MatchEntity,
  ): MatchStatItem {
    return {
      statId: stat.statId,
      minute: stat.minute,
      turn: stat.turn,
      eventType: stat.eventType as MatchEventType,
      zone: (stat.zone as MatchFieldZone | null) || null,
      action: stat.action,
      teamId: stat.teamId,
      teamName: stat.teamName,
      playerName: stat.playerName,
      playerPosition: stat.playerPosition,
      cardType: stat.cardType as MatchCardType | null,
      isGoal: stat.isGoal,
      message: this.resolveStatMessage(stat, language, match),
      creationDate: stat.creationDate,
    };
  }

  /**
   * Detects default technical timeline rows generated by restart/halftime systems.
   */
  private isCanonicalTechnicalTimelineMessage(stat: MatchStatEntity, match: MatchEntity): boolean {
    const eventType = stat.eventType as MatchEventType;
    if (!TECHNICAL_TIMELINE_EVENT_TYPES.has(eventType)) {
      return false;
    }

    const teamNameEn = stat.teamName || this.i18nService.t('match.stats.teamUnknown', 'en');
    const teamNameEs = stat.teamName || this.i18nService.t('match.stats.teamUnknown', 'es');
    const canonicalEn = this.resolveCanonicalTechnicalMessage(stat, match, 'en', teamNameEn);
    const canonicalEs = this.resolveCanonicalTechnicalMessage(stat, match, 'es', teamNameEs);
    return stat.message === canonicalEn || stat.message === canonicalEs;
  }

  /**
   * Builds canonical text for technical event rows in a given language.
   */
  private resolveCanonicalTechnicalMessage(
    stat: MatchStatEntity,
    match: MatchEntity,
    language: MatchLanguage,
    teamName: string,
  ): string {
    const eventType = stat.eventType as MatchEventType;
    switch (eventType) {
      case MatchEventType.KICKOFF_EVENT:
        return this.i18nService.t('match.restart.kickoff', language, { teamName });
      case MatchEventType.HALF_TIME_EVENT:
        return this.i18nService.t('match.stats.halfTime', language, {
          scoreTeam: match.scoreTeam,
          scoreOpponent: match.scoreOpponent,
        });
      case MatchEventType.FREE_KICK_FOR_EVENT:
      case MatchEventType.FREE_KICK_AGAINST_EVENT:
        return this.i18nService.t('match.restart.freeKick', language, { teamName });
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.CORNER_AGAINST_EVENT:
        return this.i18nService.t('match.restart.corner', language, { teamName });
      case MatchEventType.THROW_IN_FOR_EVENT:
      case MatchEventType.THROW_IN_AGAINST_EVENT:
        return this.i18nService.t('match.restart.throwIn', language, { teamName });
      default:
        return '';
    }
  }

  /**
   * Localizes match_stats timeline message at read time.
   * Falls back to persisted message when event is unknown.
   */
  private resolveStatMessage(
    stat: MatchStatEntity,
    language: MatchLanguage,
    match: MatchEntity,
  ): string {
    if (stat.messageKey) {
      return this.i18nService.t(stat.messageKey, language, this.parseStatMessageParams(stat.messageParamsJson));
    }

    const teamName = stat.teamName || this.i18nService.t('match.stats.teamUnknown', language);
    const playerName = stat.playerName || this.i18nService.t('match.fallback.unknownPlayer', language);
    const actionLabel = stat.action
      ? this.getActionLabel(stat.action as MatchAction, language, stat.action)
      : this.i18nService.t('match.stats.noAction', language);
    const eventType = stat.eventType as MatchEventType;

    if (
      TECHNICAL_TIMELINE_EVENT_TYPES.has(eventType) &&
      stat.message &&
      !this.isCanonicalTechnicalTimelineMessage(stat, match)
    ) {
      if (stat.action) {
        return this.i18nService.t('match.stats.genericEvent', language, {
          playerName,
          teamName,
          actionLabel,
        });
      }

      // Fallback for unknown custom rows.
      return stat.message;
    }

    if (stat.cardType === MatchCardType.RED) {
      return this.i18nService.t('match.stats.redCard', language, {
        playerName,
        teamName,
      });
    }

    if (stat.cardType === MatchCardType.YELLOW) {
      return this.i18nService.t('match.stats.yellowCard', language, {
        playerName,
        teamName,
      });
    }

    if (stat.isGoal) {
      return this.i18nService.t('match.stats.goal', language, {
        playerName,
        teamName,
      });
    }

    switch (eventType) {
      case MatchEventType.KICKOFF_EVENT:
        return this.i18nService.t('match.restart.kickoff', language, { teamName });
      case MatchEventType.HALF_TIME_EVENT:
        return this.i18nService.t('match.stats.halfTime', language, {
          scoreTeam: match.scoreTeam,
          scoreOpponent: match.scoreOpponent,
        });
      case MatchEventType.FREE_KICK_FOR_EVENT:
      case MatchEventType.FREE_KICK_AGAINST_EVENT:
        return this.i18nService.t('match.restart.freeKick', language, { teamName });
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.CORNER_AGAINST_EVENT:
        return this.i18nService.t('match.restart.corner', language, { teamName });
      case MatchEventType.THROW_IN_FOR_EVENT:
      case MatchEventType.THROW_IN_AGAINST_EVENT:
        return this.i18nService.t('match.restart.throwIn', language, { teamName });
      case MatchEventType.PENALTY_FOR_EVENT:
        return this.i18nService.t('match.restart.penaltyFor', language, {
          teamName,
        });
      case MatchEventType.PENALTY_AGAINST_EVENT:
        return this.i18nService.t('match.restart.penaltyAgainst', language, {
          teamName: match.teamName,
        });
      case MatchEventType.FORFEIT_EVENT:
        return this.i18nService.t('match.stats.forfeit', language, {
          teamName,
        });
      case MatchEventType.END:
        return this.i18nService.t('match.stats.matchEnded', language, {
          scoreTeam: match.scoreTeam,
          scoreOpponent: match.scoreOpponent,
        });
      default:
        return this.i18nService.t('match.stats.genericEvent', language, {
          playerName,
          teamName,
          actionLabel,
        });
    }
  }

  /**
   * Parses stored message parameters from JSON.
   */
  private parseStatMessageParams(raw: string | null): TranslationParams | undefined {
    if (!raw) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return undefined;
      }

      return parsed as TranslationParams;
    } catch {
      return undefined;
    }
  }

  /**
   * Resolves request language, defaulting to English.
   */
  private resolveLanguage(language: string | MatchLanguage | undefined): MatchLanguage {
    return this.matchRuntimeConfigHelper.resolveLanguage(language);
  }

  /**
   * Resolves one localized label for an action.
   */
  private getActionLabel(
    action: MatchAction,
    language: MatchLanguage,
    fallback?: string,
  ): string {
    return this.matchResponseMapperHelper.getActionLabel(action, language, fallback);
  }

}
