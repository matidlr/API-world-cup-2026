import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';
import { CoachEntity } from './entity/coach.entity';
import { TeamHistoryEntity } from './entity/team-history.entity';
import { TeamPlayerEntity } from './entity/team-player.entity';
import { TeamRivalEntity } from './entity/team-rival.entity';
import { Coach } from './model/coach.model';
import { TeamFormation } from './model/team-formation.model';
import { TeamStatsEntity } from './entity/team-stats.entity';
import { TeamTacticsDefaultEntity } from './entity/team-tactics-default.entity';
import { TeamEntity } from './entity/team.entity';
import { RivalTeam } from './model/rival-team.model';
import { TeamHistory } from './model/team-history.model';
import { TeamPlayer } from './model/team-player.model';
import { TeamStats } from './model/team-stats.model';
import { TeamStrategy } from './model/team-strategy.model';
import { Team } from './model/team.model';
import { CoachProfile } from './model/coach-profile.enum';

@Injectable()
/**
 * TeamsService
 *
 * Responsibilities:
 * - Handle read/write operations for the teams domain.
 * - Provide read APIs for teams, stats, players, history, and rivals.
 * - Manage the current strategy and formation configured per team.
 *
 * Core rules:
 * - Normalizes `teamId` before persistence lookups.
 * - Throws `TEAM_NOT_FOUND` when a requested resource is missing.
 *
 * Design notes:
 * - This service intentionally does not contain match engine logic.
 * - The match engine consumes this service as the source of team data.
 */
export class TeamsService {
  constructor(
    @InjectRepository(CoachEntity)
    private readonly coachRepository: Repository<CoachEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamStatsEntity)
    private readonly teamStatsRepository: Repository<TeamStatsEntity>,
    @InjectRepository(TeamPlayerEntity)
    private readonly teamPlayerRepository: Repository<TeamPlayerEntity>,
    @InjectRepository(TeamHistoryEntity)
    private readonly teamHistoryRepository: Repository<TeamHistoryEntity>,
    @InjectRepository(TeamRivalEntity)
    private readonly teamRivalRepository: Repository<TeamRivalEntity>,
    @InjectRepository(TeamTacticsDefaultEntity)
    private readonly teamTacticsDefaultRepository: Repository<TeamTacticsDefaultEntity>,
  ) {}

  /**
   * Lists teams with optional filters:
   * - `teamId` (exact, case-insensitive)
   * - `name` (partial, case-insensitive)
   * If both are provided, both conditions are applied.
   */
  async listTeams(filters?: { teamId?: string; name?: string }): Promise<Team[]> {
    const normalizedTeamId = filters?.teamId?.trim().toLowerCase();
    const normalizedName = filters?.name?.trim().toLowerCase();

    const hasTeamIdFilter = Boolean(normalizedTeamId);
    const hasNameFilter = Boolean(normalizedName);

    let teams: TeamEntity[];

    if (!hasTeamIdFilter && !hasNameFilter) {
      teams = await this.teamRepository.find({ order: { name: 'ASC' } });
      return teams.map((entity) => Team.fromEntityToModel(entity));
    }

    const qb = this.teamRepository.createQueryBuilder('team');
    if (hasTeamIdFilter) {
      qb.andWhere('LOWER(team.teamId) = :teamId', { teamId: normalizedTeamId });
    }
    if (hasNameFilter) {
      qb.andWhere('LOWER(team.name) LIKE :search', { search: `%${normalizedName}%` });
    }

    teams = await qb.orderBy('team.name', 'ASC').getMany();

    return teams.map((entity) => Team.fromEntityToModel(entity));
  }

  /**
   * Lists coaches with optional filters:
   * - `teamId` (exact, case-insensitive)
   * - `nationality` (partial, case-insensitive)
   * If both are provided, both conditions are applied.
   */
  async listCoaches(filters?: { teamId?: string; nationality?: string }): Promise<Coach[]> {
    const normalizedTeamId = filters?.teamId?.trim().toLowerCase();
    const normalizedNationality = filters?.nationality?.trim().toLowerCase();

    const hasTeamIdFilter = Boolean(normalizedTeamId);
    const hasNationalityFilter = Boolean(normalizedNationality);

    let coaches: CoachEntity[];

    if (hasTeamIdFilter || hasNationalityFilter) {
      const qb = this.coachRepository.createQueryBuilder('coach');

      if (hasTeamIdFilter) {
        qb.andWhere('LOWER(coach.teamId) = :teamId', { teamId: normalizedTeamId });
      }

      if (hasNationalityFilter) {
        qb.andWhere('LOWER(coach.nationality) LIKE :nationality', {
          nationality: `%${normalizedNationality}%`,
        });
      }

      coaches = await qb.orderBy('coach.name', 'ASC').getMany();
    } else {
      coaches = await this.coachRepository.find({ order: { name: 'ASC' } });
    }

    if (!coaches.length) {
      return [];
    }

    const teams = await this.teamRepository.find({
      where: { teamId: In(coaches.map((coach) => coach.teamId)) },
    });
    const teamNameById = new Map(teams.map((team) => [team.teamId, team.name]));

    return coaches.map((coach) =>
      Coach.fromEntityToModel(coach, teamNameById.get(coach.teamId) || coach.teamId),
    );
  }

  /**
   * Returns one team by id.
   */
  async getTeamById(teamId: string): Promise<Team> {
    const entity = await this.getTeamEntityById(teamId);
    return Team.fromEntityToModel(entity);
  }

  /**
   * Returns aggregate team stats and the current configured tactical setup.
   */
  async getTeamStats(teamId: string): Promise<TeamStats> {
    const normalizedTeamId = teamId.trim().toLowerCase();

    const team = await this.getTeamEntityById(normalizedTeamId);

    const stats = await this.teamStatsRepository.findOne({ where: { teamId: normalizedTeamId } });

    if (!stats) {
      throw new NotFoundException(ApiErrorCode.TEAM_NOT_FOUND);
    }

    return TeamStats.fromEntityToModel(stats, team.strategy, team.formation);
  }

  /**
   * Returns all players for the given team.
   */
  async getTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
    const normalizedTeamId = teamId.trim().toLowerCase();

    const team = await this.getTeamEntityById(normalizedTeamId);

    const players = await this.teamPlayerRepository.find({
      where: { teamId: normalizedTeamId },
      order: { name: 'ASC' },
    });

    const normalizedCaptainName = this.normalizePersonName(team.captain);
    return players.map((entity) =>
      TeamPlayer.fromEntityToModel(
        entity,
        this.normalizePersonName(entity.name) === normalizedCaptainName,
      ),
    );
  }

  /**
   * Returns historical records such as World Cups and titles for a team.
   */
  async getTeamHistory(teamId: string): Promise<TeamHistory> {
    const normalizedTeamId = teamId.trim().toLowerCase();

    await this.getTeamEntityById(normalizedTeamId);

    const history = await this.teamHistoryRepository.findOne({ where: { teamId: normalizedTeamId } });

    if (!history) {
      throw new NotFoundException(ApiErrorCode.TEAM_NOT_FOUND);
    }

    return TeamHistory.fromEntityToModel(history);
  }

  /**
   * Returns rival teams used for exploration/navigation flows.
   */
  async getRivals(teamId: string): Promise<RivalTeam[]> {
    const normalizedTeamId = teamId.trim().toLowerCase();

    await this.getTeamEntityById(normalizedTeamId);

    const relations = await this.teamRivalRepository.find({ where: { teamId: normalizedTeamId } });

    if (!relations.length) {
      return [];
    }

    const rivalTeams = await this.teamRepository.find({
      where: { teamId: In(relations.map((relation) => relation.rivalTeamId)) },
    });

    const nameById = new Map(rivalTeams.map((team) => [team.teamId, team.name]));

    return relations.map((relation) => ({
      id: relation.rivalTeamId,
      name: nameById.get(relation.rivalTeamId) || relation.rivalTeamId,
    }));
  }

  /**
   * Returns true when teams are linked in `team_rivals` (in any direction).
   */
  async areTeamsRivals(teamAId: string, teamBId: string): Promise<boolean> {
    const firstTeamId = teamAId.trim().toLowerCase();
    const secondTeamId = teamBId.trim().toLowerCase();

    if (firstTeamId === secondTeamId) {
      return false;
    }

    const rivalCount = await this.teamRivalRepository.count({
      where: [
        { teamId: firstTeamId, rivalTeamId: secondTeamId },
        { teamId: secondTeamId, rivalTeamId: firstTeamId },
      ],
    });

    return rivalCount > 0;
  }

  /**
   * Returns the current strategy configured for a team.
   */
  async getTeamStrategy(teamId: string): Promise<TeamStrategy> {
    const team = await this.getTeamEntityById(teamId);

    return {
      teamId: team.teamId,
      strategy: team.strategy,
    };
  }

  /**
   * Helper used by the match engine when it needs only the strategy enum value.
   */
  async getTeamStrategyValue(teamId: string): Promise<MatchStrategy> {
    const team = await this.getTeamEntityById(teamId);
    return team.strategy;
  }

  /**
   * Returns the current formation configured for a team.
   */
  async getTeamFormation(teamId: string): Promise<TeamFormation> {
    const team = await this.getTeamEntityById(teamId);

    return {
      teamId: team.teamId,
      formation: team.formation,
    };
  }

  /**
   * Helper used by the match engine when it needs only the formation enum value.
   */
  async getTeamFormationValue(teamId: string): Promise<MatchFormation> {
    const team = await this.getTeamEntityById(teamId);
    return team.formation;
  }

  /**
   * Returns coach identity metadata for a team.
   * Falls back to team.coach name when coaches table is missing data.
   */
  async getTeamCoachIdentity(
    teamId: string,
  ): Promise<{ name: string | null; profile: CoachProfile | null }> {
    const team = await this.getTeamEntityById(teamId);
    const coach = await this.coachRepository.findOne({
      where: { teamId: team.teamId },
    });

    return {
      name: coach?.name || team.coach || null,
      profile: coach?.profile || null,
    };
  }

  /**
   * Returns tactical coach config used by the match AI.
   * Provides safe defaults when coach metadata is partially missing.
   */
  async getTeamCoachTacticalConfig(teamId: string): Promise<{
    name: string;
    profile: CoachProfile;
    riskAppetite: number;
    gameManagement: number;
    adaptability: number;
    pressingBias: number;
    possessionBias: number;
    defenseBias: number;
    maxStrategyChanges: number;
  }> {
    const team = await this.getTeamEntityById(teamId);
    const coach = await this.coachRepository.findOne({
      where: { teamId: team.teamId },
    });

    return {
      name: coach?.name || team.coach || team.name,
      profile: coach?.profile || CoachProfile.BALANCED,
      riskAppetite: this.normalizeCoachMetric(coach?.riskAppetite, 50),
      gameManagement: this.normalizeCoachMetric(coach?.gameManagement, 50),
      adaptability: this.normalizeCoachMetric(coach?.adaptability, 50),
      pressingBias: this.normalizeCoachMetric(coach?.pressingBias, 50),
      possessionBias: this.normalizeCoachMetric(coach?.possessionBias, 50),
      defenseBias: this.normalizeCoachMetric(coach?.defenseBias, 50),
      maxStrategyChanges: this.normalizeCoachMetric(coach?.maxStrategyChanges, 3),
    };
  }

  /**
   * Normalizes coach numeric values and applies default fallback.
   */
  private normalizeCoachMetric(value: number | null | undefined, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(0, Math.round(value as number));
  }

  /**
   * Updates and persists the strategy for a team.
   */
  async setTeamStrategy(teamId: string, strategy: MatchStrategy): Promise<TeamStrategy> {
    const team = await this.getTeamEntityById(teamId);
    team.strategy = strategy;

    const savedTeam = await this.teamRepository.save(team);

    return {
      teamId: savedTeam.teamId,
      strategy: savedTeam.strategy,
    };
  }

  /**
   * Updates and persists the formation for a team.
   */
  async setTeamFormation(teamId: string, formation: MatchFormation): Promise<TeamFormation> {
    const team = await this.getTeamEntityById(teamId);
    team.formation = formation;

    const savedTeam = await this.teamRepository.save(team);

    return {
      teamId: savedTeam.teamId,
      formation: savedTeam.formation,
    };
  }

  /**
   * Restores one team strategy/formation to the defaults stored in `team_tactics_defaults`.
   */
  async resetTeamTacticsToDefault(teamId: string): Promise<{
    teamId: string;
    strategy: MatchStrategy;
    formation: MatchFormation;
  }> {
    const team = await this.getTeamEntityById(teamId);
    const defaultTactics = await this.teamTacticsDefaultRepository.findOne({
      where: { teamId: team.teamId },
    });

    if (!defaultTactics) {
      throw new NotFoundException(ApiErrorCode.TEAM_NOT_FOUND);
    }

    team.strategy = defaultTactics.defaultStrategy;
    team.formation = defaultTactics.defaultFormation;

    const savedTeam = await this.teamRepository.save(team);

    return {
      teamId: savedTeam.teamId,
      strategy: savedTeam.strategy,
      formation: savedTeam.formation,
    };
  }

  /**
   * Internal lookup that normalizes id and enforces `TEAM_NOT_FOUND` on missing rows.
   */
  async getTeamEntityById(teamId: string): Promise<TeamEntity> {
    const normalizedTeamId = teamId.trim().toLowerCase();
    const team = await this.teamRepository.findOne({ where: { teamId: normalizedTeamId } });

    if (!team) {
      throw new NotFoundException(ApiErrorCode.TEAM_NOT_FOUND);
    }

    return team;
  }

  private normalizePersonName(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
}
