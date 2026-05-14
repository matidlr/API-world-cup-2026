import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { In, Repository } from 'typeorm';
import { AppLocale, I18nService } from 'src/i18n/i18n.service';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchEntity } from 'src/match/entity/match.entity';
import { MatchSquadEntity } from 'src/match/entity/match-squad.entity';
import { MatchStatEntity } from 'src/match/entity/match-stat.entity';
import { MatchCardType } from 'src/match/model/match-card-type.enum';
import { TeamHistoryEntity } from 'src/teams/entity/team-history.entity';
import { TeamPlayerEntity } from 'src/teams/entity/team-player.entity';
import { TeamEntity } from 'src/teams/entity/team.entity';
import { WorldCupEntity } from './entity/world-cup.entity';
import { WorldCupGroupStandingEntity } from './entity/world-cup-group-standing.entity';
import { WorldCupMatchEntity } from './entity/world-cup-match.entity';
import { WorldCupPlayerStatEntity } from './entity/world-cup-player-stat.entity';
import { WorldCupAward } from './model/world-cup-award.model';
import { WorldCupFullPlayerStat } from './model/world-cup-full-player-stat.model';
import { WorldCupGroup } from './model/world-cup-group.model';
import { WorldCupGroupTeam } from './model/world-cup-group-team.model';
import { WorldCupMatchResolution } from './model/world-cup-match-resolution.enum';
import { WorldCupMatch } from './model/world-cup-match.model';
import { WorldCupPlayerStat } from './model/world-cup-player-stat.model';
import { WorldCupPodiumTeam } from './model/world-cup-podium-team.model';
import { WorldCupStage } from './model/world-cup-stage.enum';
import { WorldCupStats } from './model/world-cup-stats.model';
import { WorldCupTeamJourneyMatchResult } from './model/world-cup-team-journey-match-result.enum';
import { WorldCupTeamJourneyMatch } from './model/world-cup-team-journey-match.model';
import { WorldCupTeamJourneyStage } from './model/world-cup-team-journey-stage.enum';
import { WorldCupTeamJourney } from './model/world-cup-team-journey.model';
import { WorldCupStatus } from './model/world-cup-status.enum';
import { WorldCup } from './model/world-cup.model';
import { SimulateWorldCupRequest } from './request/simulate-world-cup.request';

interface StandingAccumulator {
  worldCupId: string;
  groupName: string;
  teamId: string;
  teamName: string;
  confederation: string;
  rating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  isQualified: boolean;
  isBestThird: boolean;
}

interface PlayerTally {
  worldCupId: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  position: string;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  playerOfMatch: number;
}

interface MatchPlayerContribution {
  team: TeamEntity;
  player: TeamPlayerEntity;
  goals: number;
  assists: number;
  cleanSheets: number;
}

interface MatchPlayerMinuteDetail {
  playerName: string;
  minute: number;
}

interface MatchCardDetail {
  playerName: string;
  minute: number;
  cardType: MatchCardType;
}

interface MatchSubstitutionDetail {
  playerInName: string;
  playerOutName: string;
  minute: number;
}

interface MatchPlayerOfMatchDetail {
  playerName: string;
  teamId: string;
  teamName: string;
}

interface TeamMatchDetails {
  totalYellowCards: number;
  totalRedCards: number;
  goalsDetails: MatchPlayerMinuteDetail[];
  cardsDetails: MatchCardDetail[];
  injuriesDetails: MatchPlayerMinuteDetail[];
  substitutionsDetails: MatchSubstitutionDetail[];
}

interface SimulatedMatchDetails {
  home: TeamMatchDetails;
  away: TeamMatchDetails;
  playerOfMatch: MatchPlayerOfMatchDetail | null;
}

interface FairPlayTeamScore {
  teamId: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  fairPlayPoints: number;
  reachedKnockout: boolean;
  bestStageRank: number;
}

interface FinalPlayerContribution {
  teamId: string;
  teamName: string;
  playerName: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface SimulatedKnockoutRound {
  matches: WorldCupMatchEntity[];
  winners: TeamEntity[];
  losers: TeamEntity[];
}

interface SimulatedMatch {
  homeGoals: number;
  awayGoals: number;
  homePenaltyGoals: number | null;
  awayPenaltyGoals: number | null;
  winner: TeamEntity | null;
  resolution: WorldCupMatchResolution;
  details: SimulatedMatchDetails | null;
}

@Injectable()
/**
 * WorldCupService
 *
 * Responsibilities:
 * - Simulate complete World Cup path up to a pending final.
 * - Keep tournament lifecycle state (`READY_FOR_FINAL`, `FINAL_ACTIVE`, `ENDED`).
 * - Provide read APIs for history, groups, matches, stats and awards.
 * - Bridge final lifecycle with MatchService through `markFinalActive/markFinalEnded`.
 */
export class WorldCupService {
  private static readonly GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  private static readonly STAGE_RANK: Record<WorldCupStage, number> = {
    [WorldCupStage.GROUP_STAGE]: 1,
    [WorldCupStage.ROUND_OF_32]: 2,
    [WorldCupStage.ROUND_OF_16]: 3,
    [WorldCupStage.QUARTER_FINALS]: 4,
    [WorldCupStage.SEMI_FINALS]: 5,
    [WorldCupStage.THIRD_PLACE]: 6,
    [WorldCupStage.FINAL]: 7,
  };
  private readonly worldCupEdition: number;

  constructor(
    @InjectRepository(WorldCupEntity)
    private readonly worldCupRepository: Repository<WorldCupEntity>,
    @InjectRepository(WorldCupGroupStandingEntity)
    private readonly worldCupGroupStandingRepository: Repository<WorldCupGroupStandingEntity>,
    @InjectRepository(WorldCupMatchEntity)
    private readonly worldCupMatchRepository: Repository<WorldCupMatchEntity>,
    @InjectRepository(WorldCupPlayerStatEntity)
    private readonly worldCupPlayerStatRepository: Repository<WorldCupPlayerStatEntity>,
    @InjectRepository(MatchStatEntity)
    private readonly matchStatRepository: Repository<MatchStatEntity>,
    @InjectRepository(MatchSquadEntity)
    private readonly matchSquadRepository: Repository<MatchSquadEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamHistoryEntity)
    private readonly teamHistoryRepository: Repository<TeamHistoryEntity>,
    @InjectRepository(TeamPlayerEntity)
    private readonly teamPlayerRepository: Repository<TeamPlayerEntity>,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
  ) {
    this.worldCupEdition = this.loadWorldCupEdition();
  }

  /**
   * Simulates the full tournament until a pending final.
   * If there is a READY tournament, it is re-simulated (same id).
   */
  async simulateWorldCup(request: SimulateWorldCupRequest): Promise<WorldCup> {
    const selectedTeamId = request.teamId.trim().toLowerCase();
    const selectedTeam = await this.getTeamById(selectedTeamId);

    const current = await this.findCurrentWorldCup();
    if (current && current.status === WorldCupStatus.FINAL_ACTIVE) {
      throw new ConflictException(ApiErrorCode.WORLD_CUP_FINAL_ACTIVE);
    }

    let worldCup: WorldCupEntity;
    if (current && current.status === WorldCupStatus.READY_FOR_FINAL) {
      worldCup = current;
      worldCup.selectedTeamId = selectedTeam.teamId;
      worldCup.selectedTeamName = selectedTeam.name;
    } else {
      await this.worldCupRepository.update({ isCurrent: true }, { isCurrent: false });
      worldCup = this.worldCupRepository.create({
        worldCupId: `wc_${uuidv4()}`,
        edition: this.worldCupEdition,
        status: WorldCupStatus.READY_FOR_FINAL,
        isCurrent: true,
        selectedTeamId,
        selectedTeamName: selectedTeam.name,
        finalHomeTeamId: selectedTeamId,
        finalHomeTeamName: selectedTeam.name,
        finalAwayTeamId: selectedTeamId,
        finalAwayTeamName: selectedTeam.name,
        finalMatchId: null,
        notesJson: '[]',
      });
    }

    await this.clearSimulationData(worldCup.worldCupId);

    const simulation = await this.runSimulation(worldCup.worldCupId, selectedTeam);

    worldCup.status = WorldCupStatus.READY_FOR_FINAL;
    worldCup.finalHomeTeamId = simulation.finalHome.teamId;
    worldCup.finalHomeTeamName = simulation.finalHome.name;
    worldCup.finalAwayTeamId = simulation.finalAway.teamId;
    worldCup.finalAwayTeamName = simulation.finalAway.name;
    worldCup.finalMatchId = null;
    worldCup.notesJson = JSON.stringify(simulation.notes);

    const savedWorldCup = await this.worldCupRepository.save(worldCup);
    await this.worldCupGroupStandingRepository.save(simulation.groupRows);
    await this.worldCupMatchRepository.save(simulation.matches);
    await this.worldCupPlayerStatRepository.save(simulation.playerStats);

    return this.toWorldCupModel(savedWorldCup);
  }

  /**
   * Ensures there is a READY tournament and returns the two finalists resolved as user/opponent.
   *
   * Rules:
   * - If no current world cup exists (or current is ended) and `teamId` is provided, a new simulation is created.
   * - If `teamId` is provided while world cup is READY, it must be one of the two finalists.
   * - If `teamId` is omitted, the simulated selected team is used by default.
   */
  async ensureReadyFinalForTeam(
    teamId?: string,
  ): Promise<{ worldCup: WorldCupEntity; selectedTeam: TeamEntity; opponent: TeamEntity }> {
    const requestedTeamId = teamId?.trim().toLowerCase();

    let current = await this.findCurrentWorldCup();
    if (!current || current.status === WorldCupStatus.ENDED) {
      if (!requestedTeamId) {
        throw new NotFoundException(ApiErrorCode.WORLD_CUP_NOT_FOUND);
      }

      await this.simulateWorldCup({ teamId: requestedTeamId });
      current = await this.findCurrentWorldCup();
    }

    if (!current) {
      throw new NotFoundException(ApiErrorCode.WORLD_CUP_NOT_FOUND);
    }

    if (current.status === WorldCupStatus.FINAL_ACTIVE) {
      throw new ConflictException(ApiErrorCode.WORLD_CUP_FINAL_ACTIVE);
    }

    if (current.status !== WorldCupStatus.READY_FOR_FINAL) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    const finalTeamIds = [current.finalHomeTeamId, current.finalAwayTeamId];
    if (!finalTeamIds[0] || !finalTeamIds[1] || finalTeamIds[0] === finalTeamIds[1]) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    const selectedTeamId = requestedTeamId ?? current.selectedTeamId;
    if (!selectedTeamId || !finalTeamIds.includes(selectedTeamId)) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    const opponentId = finalTeamIds[0] === selectedTeamId ? finalTeamIds[1] : finalTeamIds[0];

    const selectedTeam = await this.getTeamById(selectedTeamId);
    const opponent = await this.getTeamById(opponentId);
    return { worldCup: current, selectedTeam, opponent };
  }

  /**
   * Marks current world cup as FINAL_ACTIVE.
   */
  async markFinalActive(matchId: string, homeTeamId: string, awayTeamId: string): Promise<void> {
    const current = await this.findCurrentWorldCup();
    if (!current) {
      return;
    }

    current.status = WorldCupStatus.FINAL_ACTIVE;
    current.finalMatchId = matchId;
    current.finalHomeTeamId = homeTeamId;
    current.finalAwayTeamId = awayTeamId;

    await this.worldCupRepository.save(current);
  }

  /**
   * Marks current world cup as ENDED and seals final result inside tournament matches.
   */
  async markFinalEnded(finalMatch: MatchEntity): Promise<void> {
    const current = await this.findCurrentWorldCup();
    if (!current || current.status !== WorldCupStatus.FINAL_ACTIVE) {
      return;
    }

    const finalRow = await this.worldCupMatchRepository.findOne({
      where: { worldCupId: current.worldCupId, stage: WorldCupStage.FINAL },
      order: { worldCupMatchId: 'DESC' },
    });

    if (finalRow) {
      finalRow.homeGoals =
        finalRow.homeTeamId === finalMatch.teamId ? finalMatch.scoreTeam : finalMatch.scoreOpponent;
      finalRow.awayGoals =
        finalRow.awayTeamId === finalMatch.opponentId ? finalMatch.scoreOpponent : finalMatch.scoreTeam;

      const winnerTeamId =
        finalMatch.scoreTeam > finalMatch.scoreOpponent ? finalMatch.teamId : finalMatch.opponentId;
      const winnerTeamName =
        finalMatch.scoreTeam > finalMatch.scoreOpponent ? finalMatch.teamName : finalMatch.opponentName;

      finalRow.winnerTeamId = winnerTeamId;
      finalRow.winnerTeamName = winnerTeamName;
      finalRow.resolution = WorldCupMatchResolution.REGULAR_TIME;
      finalRow.isPending = false;
      await this.worldCupMatchRepository.save(finalRow);
    }

    await this.syncFinalMatchPlayerStats(current.worldCupId, finalMatch, finalRow);

    current.status = WorldCupStatus.ENDED;
    current.finalMatchId = finalMatch.matchId;
    await this.worldCupRepository.save(current);
  }

  /**
   * Returns current world cup metadata.
   */
  async getCurrentWorldCup(): Promise<WorldCup> {
    const current = await this.findCurrentWorldCup();
    if (!current) {
      throw new NotFoundException(ApiErrorCode.WORLD_CUP_NOT_FOUND);
    }

    return this.toWorldCupModel(current);
  }

  /**
   * Returns historical world cup ids (newest first).
   */
  async listHistoryIds(): Promise<string[]> {
    const cups = await this.worldCupRepository.find({ order: { creationDate: 'DESC' } });
    return cups.map((cup) => cup.worldCupId);
  }

  /**
   * Returns world cup metadata by id.
   */
  async getWorldCupById(worldCupId: string): Promise<WorldCup> {
    const worldCup = await this.getWorldCupEntityById(worldCupId);
    return this.toWorldCupModel(worldCup);
  }

  /**
   * Returns all group tables for the selected world cup.
   */
  async getGroupsById(worldCupId: string): Promise<WorldCupGroup[]> {
    await this.getWorldCupEntityById(worldCupId);

    const standings = await this.worldCupGroupStandingRepository.find({
      where: { worldCupId: worldCupId.trim() },
      order: { groupName: 'ASC', position: 'ASC', points: 'DESC', goalDifference: 'DESC', goalsFor: 'DESC' },
    });

    const grouped = new Map<string, WorldCupGroupTeam[]>();
    for (const row of standings) {
      if (!grouped.has(row.groupName)) {
        grouped.set(row.groupName, []);
      }

      grouped.get(row.groupName)?.push({
        teamId: row.teamId,
        teamName: row.teamName,
        confederation: row.confederation,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
        position: row.position,
        isQualified: row.isQualified,
        isBestThird: row.isBestThird,
      });
    }

    return Array.from(grouped.entries()).map(([group, teams]) => ({ group, teams }));
  }

  /**
   * Returns every simulated match for the selected world cup.
   */
  async getMatchesById(worldCupId: string, stage?: string): Promise<WorldCupMatch[]> {
    await this.getWorldCupEntityById(worldCupId);
    const normalizedWorldCupId = worldCupId.trim();
    const stageFilter = this.parseStageFilter(stage);

    const matches = await this.worldCupMatchRepository.find({
      where: {
        worldCupId: normalizedWorldCupId,
        ...(stageFilter ? { stage: stageFilter } : {}),
      },
      order: { creationDate: 'ASC', worldCupMatchId: 'ASC' },
    });

    return matches.map((match) => this.toWorldCupMatchModel(match));
  }

  /**
   * Returns aggregated tournament statistics.
   */
  async getStatsById(worldCupId: string): Promise<WorldCupStats> {
    const worldCup = await this.getWorldCupEntityById(worldCupId);
    if (worldCup.status !== WorldCupStatus.ENDED) {
      throw new ConflictException(ApiErrorCode.WORLD_CUP_NOT_ENDED);
    }
    const normalizedWorldCupId = worldCup.worldCupId;

    const matches = await this.worldCupMatchRepository.find({
      where: { worldCupId: normalizedWorldCupId, isPending: false },
      order: { creationDate: 'ASC', worldCupMatchId: 'ASC' },
    });

    const totalMatches = matches.length;
    const totalGoals = matches.reduce(
      (sum, match) => sum + (match.homeGoals || 0) + (match.awayGoals || 0),
      0,
    );
    const avgGoalsPerMatch = totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0;

    const playerStats = await this.worldCupPlayerStatRepository.find({
      where: { worldCupId: normalizedWorldCupId },
    });

    const topScorers = playerStats
      .slice()
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.playerOfMatch - a.playerOfMatch)
      .slice(0, 3)
      .map((row) => this.toPlayerStatModel(row, row.goals));

    const topAssists = playerStats
      .slice()
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals || b.playerOfMatch - a.playerOfMatch)
      .slice(0, 3)
      .map((row) => this.toPlayerStatModel(row, row.assists));

    const bestGoalkeepers = playerStats
      .filter((row) => row.position === 'GK')
      .sort((a, b) => b.cleanSheets - a.cleanSheets || b.playerOfMatch - a.playerOfMatch)
      .slice(0, 3)
      .map((row) => this.toPlayerStatModel(row, row.cleanSheets));

    const cleanSheetLeaders = playerStats
      .filter((row) => row.position === 'GK')
      .sort((a, b) => b.cleanSheets - a.cleanSheets || b.playerOfMatch - a.playerOfMatch)
      .slice(0, 3)
      .map((row) => this.toPlayerStatModel(row, row.cleanSheets));

    const topPotmRow = playerStats
      .slice()
      .sort((a, b) => b.playerOfMatch - a.playerOfMatch || b.goals - a.goals || b.assists - a.assists)[0];

    const { champion, runnerUp, thirdPlace, fourthPlace } = this.extractPodium(matches);
    const cards = {
      totalYellowCards: playerStats.reduce((sum, row) => sum + (row.yellowCards || 0), 0),
      totalRedCards: playerStats.reduce((sum, row) => sum + (row.redCards || 0), 0),
    };

    return {
      totalMatches,
      totalGoals,
      avgGoalsPerMatch,
      champion,
      runnerUp,
      thirdPlace,
      fourthPlace,
      topScorers,
      topAssists,
      bestGoalkeepers,
      cleanSheetLeaders,
      topPlayerOfMatch: topPotmRow ? this.toPlayerStatModel(topPotmRow, topPotmRow.playerOfMatch) : null,
      cards,
    };
  }

  /**
   * Returns full player stats for one tournament.
   * Optional `teamId` filters rows to one team.
   */
  async getPlayerStatsById(worldCupId: string, teamId?: string): Promise<WorldCupFullPlayerStat[]> {
    const worldCup = await this.getWorldCupEntityById(worldCupId);
    const normalizedWorldCupId = worldCup.worldCupId;
    const normalizedTeamId = teamId?.trim().toLowerCase();
    if (normalizedTeamId) {
      await this.getTeamById(normalizedTeamId);
    }

    const matches = await this.worldCupMatchRepository.find({
      where: { worldCupId: normalizedWorldCupId },
      select: ['homeTeamId', 'awayTeamId'],
    });

    const participatingTeamIds = new Set<string>();
    for (const row of matches) {
      if (row.homeTeamId) {
        participatingTeamIds.add(row.homeTeamId);
      }
      if (row.awayTeamId) {
        participatingTeamIds.add(row.awayTeamId);
      }
    }

    const targetTeamIds = normalizedTeamId
      ? [normalizedTeamId]
      : Array.from(participatingTeamIds.values()).sort();
    if (!targetTeamIds.length) {
      return [];
    }

    const [rosterRows, statsRows, teams] = await Promise.all([
      this.teamPlayerRepository.find({
        where: { teamId: In(targetTeamIds) },
        order: { teamId: 'ASC', name: 'ASC' },
      }),
      this.worldCupPlayerStatRepository.find({
        where: { worldCupId: normalizedWorldCupId, teamId: In(targetTeamIds) },
      }),
      this.teamRepository.find({
        where: { teamId: In(targetTeamIds) },
      }),
    ]);

    const statByPlayerId = new Map<string, WorldCupPlayerStatEntity>();
    const statByPlayerName = new Map<string, WorldCupPlayerStatEntity>();
    for (const row of statsRows) {
      statByPlayerId.set(`${row.teamId}:${row.playerId}`, row);
      statByPlayerName.set(`${row.teamId}:${this.normalizePlayerKey(row.playerName)}`, row);
    }

    const teamNameById = new Map<string, string>(teams.map((team) => [team.teamId, team.name]));

    const merged: WorldCupFullPlayerStat[] = rosterRows.map((player) => {
      const statById = statByPlayerId.get(`${player.teamId}:${player.playerId}`);
      const statByName = statByPlayerName.get(`${player.teamId}:${this.normalizePlayerKey(player.name)}`);
      const row = statById || statByName;

      return {
        playerId: player.playerId,
        playerName: player.name,
        teamId: player.teamId,
        teamName: teamNameById.get(player.teamId) || row?.teamName || player.teamId,
        position: player.position,
        goals: row?.goals || 0,
        assists: row?.assists || 0,
        cleanSheets: row?.cleanSheets || 0,
        yellowCards: row?.yellowCards || 0,
        redCards: row?.redCards || 0,
        minutesPlayed: row?.minutesPlayed || 0,
        playerOfMatch: row?.playerOfMatch || 0,
      };
    });

    return merged.sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        b.playerOfMatch - a.playerOfMatch ||
        b.cleanSheets - a.cleanSheets ||
        a.playerName.localeCompare(b.playerName),
    );
  }

  /**
   * Returns final awards for ended tournaments.
   */
  async getAwardsById(worldCupId: string, lang?: string): Promise<WorldCupAward[]> {
    const locale = this.resolveLocale(lang);
    const worldCup = await this.getWorldCupEntityById(worldCupId);
    if (worldCup.status !== WorldCupStatus.ENDED) {
      throw new ConflictException(ApiErrorCode.WORLD_CUP_NOT_ENDED);
    }

    const stats = await this.worldCupPlayerStatRepository.find({ where: { worldCupId: worldCupId.trim() } });
    if (!stats.length) {
      return [];
    }

    const matches = await this.worldCupMatchRepository.find({
      where: { worldCupId: worldCupId.trim(), isPending: false },
      order: { creationDate: 'ASC', worldCupMatchId: 'ASC' },
    });
    const stageBonusByTeam = this.buildStageBonusByTeam(matches);
    const { finalistTeamIds, championTeamId, topFourTeamIds } = this.extractAwardTeamBuckets(matches);
    const goalsAgainstByTeam = this.buildGoalsAgainstByTeam(matches);

    const topByGoals = stats
      .slice()
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.playerOfMatch - a.playerOfMatch);

    const topByImpact = stats
      .slice()
      .sort((a, b) => b.goals + b.assists + b.playerOfMatch * 2 - (a.goals + a.assists + a.playerOfMatch * 2));

    const goldenBallCandidates = stats
      .filter((row) => finalistTeamIds.has(row.teamId))
      .sort((a, b) => {
        const impactA = a.goals + a.assists + a.playerOfMatch * 2 + (stageBonusByTeam.get(a.teamId) || 0);
        const impactB = b.goals + b.assists + b.playerOfMatch * 2 + (stageBonusByTeam.get(b.teamId) || 0);
        const championPriorityA = a.teamId === championTeamId ? 1 : 0;
        const championPriorityB = b.teamId === championTeamId ? 1 : 0;

        return (
          impactB - impactA ||
          b.goals - a.goals ||
          b.assists - a.assists ||
          championPriorityB - championPriorityA ||
          b.playerOfMatch - a.playerOfMatch
        );
      });

    const topGk = stats
      .filter((row) => row.position === 'GK')
      .sort((a, b) => b.cleanSheets - a.cleanSheets || b.playerOfMatch - a.playerOfMatch);

    const goldenGloveCandidates = stats
      .filter((row) => row.position === 'GK' && topFourTeamIds.has(row.teamId))
      .sort((a, b) => {
        const goalsAgainstA = goalsAgainstByTeam.get(a.teamId) || 0;
        const goalsAgainstB = goalsAgainstByTeam.get(b.teamId) || 0;
        return (
          b.cleanSheets - a.cleanSheets ||
          goalsAgainstA - goalsAgainstB ||
          b.playerOfMatch - a.playerOfMatch
        );
      });

    const awards: WorldCupAward[] = [];

    if (goldenBallCandidates[0]) {
      awards.push(
        this.buildAward(
          'GOLDEN_BALL',
          goldenBallCandidates[0],
          'worldCup.award.reason.GOLDEN_BALL_FINALISTS',
          locale,
        ),
      );
    } else if (topByImpact[0]) {
      awards.push(
        this.buildAward(
          'GOLDEN_BALL',
          topByImpact[0],
          'worldCup.award.reason.GOLDEN_BALL',
          locale,
        ),
      );
    }
    if (topByGoals[0]) {
      awards.push(
        this.buildAward(
          'GOLDEN_BOOT',
          topByGoals[0],
          'worldCup.award.reason.GOLDEN_BOOT',
          locale,
        ),
      );
    }
    if (topByGoals[1]) {
      awards.push(
        this.buildAward(
          'SILVER_BOOT',
          topByGoals[1],
          'worldCup.award.reason.SILVER_BOOT',
          locale,
        ),
      );
    }
    if (topByGoals[2]) {
      awards.push(
        this.buildAward(
          'BRONZE_BOOT',
          topByGoals[2],
          'worldCup.award.reason.BRONZE_BOOT',
          locale,
        ),
      );
    }
    if (goldenGloveCandidates[0]) {
      awards.push(
        this.buildAward(
          'GOLDEN_GLOVE',
          goldenGloveCandidates[0],
          'worldCup.award.reason.GOLDEN_GLOVE_TOP4',
          locale,
        ),
      );
    } else if (topGk[0]) {
      awards.push(
        this.buildAward(
          'GOLDEN_GLOVE',
          topGk[0],
          'worldCup.award.reason.GOLDEN_GLOVE',
          locale,
        ),
      );
    }

    const fairPlayWinner = this.resolveFairPlayWinner(matches);
    if (fairPlayWinner) {
      awards.push(this.buildFairPlayAward(fairPlayWinner, locale));
    }

    return awards;
  }

  /**
   * Returns one team journey for the current world cup.
   */
  async getCurrentTeamJourney(teamId: string, lang?: string): Promise<WorldCupTeamJourney> {
    const current = await this.findCurrentWorldCup();
    if (!current) {
      throw new NotFoundException(ApiErrorCode.WORLD_CUP_NOT_FOUND);
    }

    return this.getTeamJourneyByWorldCupId(current.worldCupId, teamId, lang);
  }

  /**
   * Returns one team journey for a specific world cup id.
   */
  async getTeamJourneyByWorldCupId(
    worldCupId: string,
    teamId: string,
    lang?: string,
  ): Promise<WorldCupTeamJourney> {
    const locale = this.resolveLocale(lang);
    const normalizedTeamId = teamId.trim().toLowerCase();
    const worldCup = await this.getWorldCupEntityById(worldCupId);
    const team = await this.getTeamById(normalizedTeamId);

    const rows = await this.worldCupMatchRepository
      .createQueryBuilder('match')
      .where('match.worldCupId = :worldCupId', { worldCupId: worldCup.worldCupId })
      .andWhere('(match.homeTeamId = :teamId OR match.awayTeamId = :teamId)', {
        teamId: normalizedTeamId,
      })
      .orderBy('match.creationDate', 'ASC')
      .addOrderBy('match.worldCupMatchId', 'ASC')
      .getMany();

    const matches = rows.map((row) => this.toJourneyMatchModel(row, normalizedTeamId));
    const finalMatch = rows.find((row) => row.stage === WorldCupStage.FINAL) || null;

    let stageReached = this.resolveJourneyStageReached(rows);
    let isChampion = false;
    let isFinalPending = false;
    let eliminatedByTeamId: string | null = null;
    let eliminatedByTeamName: string | null = null;

    if (finalMatch) {
      if (finalMatch.isPending) {
        isFinalPending = true;
        stageReached = WorldCupTeamJourneyStage.FINAL;
      } else if (finalMatch.winnerTeamId === normalizedTeamId) {
        isChampion = true;
        stageReached = WorldCupTeamJourneyStage.CHAMPION;
      } else if (finalMatch.winnerTeamId && finalMatch.winnerTeamId !== normalizedTeamId) {
        stageReached = WorldCupTeamJourneyStage.FINAL;
        eliminatedByTeamId = finalMatch.winnerTeamId;
        eliminatedByTeamName = finalMatch.winnerTeamName;
      }
    }

    if (!isChampion && !isFinalPending && !eliminatedByTeamId) {
      const elimination = this.findKnockoutElimination(rows, normalizedTeamId);
      if (elimination) {
        eliminatedByTeamId = elimination.winnerTeamId;
        eliminatedByTeamName = elimination.winnerTeamName;
      }
    }

    const summary = this.buildJourneySummary({
      teamName: team.name,
      locale,
      worldCupStatus: worldCup.status,
      stageReached,
      isChampion,
      isFinalPending,
      eliminatedByTeamName,
      finalMatch,
      teamId: normalizedTeamId,
      eliminationMatch: this.findKnockoutElimination(rows, normalizedTeamId),
      hasMatches: rows.length > 0,
      hasKnockoutMatches: rows.some((row) => row.stage !== WorldCupStage.GROUP_STAGE),
    });

    return {
      worldCupId: worldCup.worldCupId,
      teamId: team.teamId,
      teamName: team.name,
      lang: locale,
      worldCupStatus: worldCup.status,
      stageReached,
      isChampion,
      isFinalPending,
      eliminatedByTeamId,
      eliminatedByTeamName,
      summary,
      matches,
    };
  }

  private buildAward(
    code: string,
    stat: WorldCupPlayerStatEntity,
    reasonKey: string,
    locale: AppLocale,
  ): WorldCupAward {
    return {
      code,
      winnerName: stat.playerName,
      teamId: stat.teamId,
      teamName: stat.teamName,
      reason: this.i18nService.t(reasonKey, locale),
      goals: stat.goals || 0,
      playerOfMatch: stat.playerOfMatch || 0,
    };
  }

  /**
   * Builds the team-level Fair Play award payload.
   */
  private buildFairPlayAward(
    fairPlayWinner: FairPlayTeamScore,
    locale: AppLocale,
  ): WorldCupAward {
    return {
      code: 'FAIR_PLAY',
      winnerName: fairPlayWinner.teamName,
      teamId: fairPlayWinner.teamId,
      teamName: fairPlayWinner.teamName,
      reason: this.i18nService.t('worldCup.award.reason.FAIR_PLAY', locale),
      goals: 0,
      playerOfMatch: 0,
      fairPlayPoints: fairPlayWinner.fairPlayPoints,
      yellowCards: fairPlayWinner.yellowCards,
      redCards: fairPlayWinner.redCards,
    };
  }

  /**
   * Syncs final real-match events into world_cup_player_stats so tournament
   * stats remain consistent after users play the final manually.
   */
  private async syncFinalMatchPlayerStats(
    worldCupId: string,
    finalMatch: MatchEntity,
    finalRow: WorldCupMatchEntity | null,
  ): Promise<void> {
    const finalistTeamIds = [finalMatch.teamId, finalMatch.opponentId]
      .map((teamId) => teamId.trim().toLowerCase())
      .filter(Boolean);
    if (finalistTeamIds.length !== 2) {
      return;
    }

    const eventRows = await this.matchStatRepository.find({
      where: { matchId: finalMatch.matchId },
      order: { creationDate: 'ASC', statId: 'ASC' },
    });

    if (!eventRows.length) {
      return;
    }

    const existingStats = await this.worldCupPlayerStatRepository.find({
      where: { worldCupId, teamId: In(finalistTeamIds) },
    });

    const statCache = new Map(
      existingStats.map((row) => [
        `${row.teamId}:${this.normalizePlayerKey(row.playerName)}`,
        row,
      ]),
    );
    const touchedRows = new Map<string, WorldCupPlayerStatEntity>();
    const contributionByPlayer = new Map<string, FinalPlayerContribution>();
    const details: SimulatedMatchDetails = {
      home: this.createEmptyTeamMatchDetails(),
      away: this.createEmptyTeamMatchDetails(),
      playerOfMatch: null,
    };

    const teamNameById = new Map<string, string>([
      [finalMatch.teamId.trim().toLowerCase(), finalMatch.teamName],
      [finalMatch.opponentId.trim().toLowerCase(), finalMatch.opponentName],
      [finalRow?.homeTeamId?.trim().toLowerCase() || '', finalRow?.homeTeamName || ''],
      [finalRow?.awayTeamId?.trim().toLowerCase() || '', finalRow?.awayTeamName || ''],
    ]);
    const homeTeamId = (finalRow?.homeTeamId || finalMatch.teamId).trim().toLowerCase();
    const awayTeamId = (finalRow?.awayTeamId || finalMatch.opponentId).trim().toLowerCase();

    for (const event of eventRows) {
      const teamId = event.teamId?.trim().toLowerCase();
      const playerName = event.playerName?.trim();
      const minute = this.clamp(1, 90, event.minute || 1);
      const teamDetails =
        teamId === homeTeamId
          ? details.home
          : teamId === awayTeamId
            ? details.away
            : null;

      const hasGoal = Boolean(event.isGoal);
      const hasYellow = event.cardType === MatchCardType.YELLOW;
      const hasRed = event.cardType === MatchCardType.RED;

      if (teamDetails) {
        if (hasGoal && playerName) {
          teamDetails.goalsDetails.push({ playerName, minute });
        }

        if (playerName && (hasYellow || hasRed)) {
          const cardType = hasRed ? MatchCardType.RED : MatchCardType.YELLOW;
          teamDetails.cardsDetails.push({ playerName, minute, cardType });
          if (cardType === MatchCardType.YELLOW) {
            teamDetails.totalYellowCards += 1;
          } else {
            teamDetails.totalRedCards += 1;
          }
        }

        const substitution = this.parseSubstitutionDetailFromEvent(event);
        if (substitution) {
          teamDetails.substitutionsDetails.push({
            ...substitution,
            minute,
          });
        }

        if (playerName && this.eventLooksLikeInjury(event)) {
          teamDetails.injuriesDetails.push({
            playerName,
            minute,
          });
        }
      }

      if (!teamId || !playerName || !finalistTeamIds.includes(teamId)) {
        continue;
      }

      if (!hasGoal && !hasYellow && !hasRed) {
        continue;
      }

      const teamName = teamNameById.get(teamId) || event.teamName || teamId;
      const row = await this.ensureWorldCupPlayerStatRow({
        worldCupId,
        teamId,
        teamName,
        playerName,
        playerPosition: event.playerPosition,
        statCache,
      });

      const contributionKey = `${teamId}:${this.normalizePlayerKey(playerName)}`;
      const contribution = contributionByPlayer.get(contributionKey) || {
        teamId,
        teamName,
        playerName,
        goals: 0,
        yellowCards: 0,
        redCards: 0,
      };

      if (hasGoal) {
        row.goals += 1;
        contribution.goals += 1;
      }
      if (hasYellow) {
        row.yellowCards += 1;
        contribution.yellowCards += 1;
      }
      if (hasRed) {
        row.redCards += 1;
        contribution.redCards += 1;
      }

      contributionByPlayer.set(contributionKey, contribution);
      touchedRows.set(contributionKey, row);
    }

    const winnerTeamId = (finalRow?.winnerTeamId ||
      (finalMatch.scoreTeam > finalMatch.scoreOpponent ? finalMatch.teamId : finalMatch.opponentId)
    )
      .trim()
      .toLowerCase();

    const rankedContributions = Array.from(contributionByPlayer.values()).sort((a, b) => {
      const scoreA = a.goals * 5 - a.yellowCards - a.redCards * 3;
      const scoreB = b.goals * 5 - b.yellowCards - b.redCards * 3;
      const winnerPriorityA = a.teamId === winnerTeamId ? 1 : 0;
      const winnerPriorityB = b.teamId === winnerTeamId ? 1 : 0;

      return (
        winnerPriorityB - winnerPriorityA ||
        scoreB - scoreA ||
        b.goals - a.goals ||
        a.redCards - b.redCards ||
        a.yellowCards - b.yellowCards
      );
    });

    let selectedPlayerOfMatch: MatchPlayerOfMatchDetail | null = null;
    if (rankedContributions[0]) {
      const best = rankedContributions[0];
      const bestScore = best.goals * 5 - best.yellowCards - best.redCards * 3;
      if (bestScore > 0) {
        const key = `${best.teamId}:${this.normalizePlayerKey(best.playerName)}`;
        const row = touchedRows.get(key)
          || (await this.ensureWorldCupPlayerStatRow({
            worldCupId,
            teamId: best.teamId,
            teamName: best.teamName,
            playerName: best.playerName,
            statCache,
          }));
        row.playerOfMatch += 1;
        touchedRows.set(key, row);
        selectedPlayerOfMatch = {
          playerName: best.playerName,
          teamId: best.teamId,
          teamName: best.teamName,
        };
      }
    }

    if (!selectedPlayerOfMatch) {
      const fallbackPotm = await this.resolveFinalPotmFallback(finalMatch.matchId, winnerTeamId);
      if (fallbackPotm) {
        const row = await this.ensureWorldCupPlayerStatRow({
          worldCupId,
          teamId: fallbackPotm.teamId,
          teamName: fallbackPotm.teamName,
          playerName: fallbackPotm.playerName,
          playerPosition: fallbackPotm.playerPosition,
          statCache,
        });
        const key = `${fallbackPotm.teamId}:${this.normalizePlayerKey(fallbackPotm.playerName)}`;
        row.playerOfMatch += 1;
        touchedRows.set(key, row);
        selectedPlayerOfMatch = {
          playerName: fallbackPotm.playerName,
          teamId: fallbackPotm.teamId,
          teamName: fallbackPotm.teamName,
        };
      }
    }

    if (touchedRows.size) {
      await this.worldCupPlayerStatRepository.save(Array.from(touchedRows.values()));
    }

    this.sortTeamMatchDetails(details.home);
    this.sortTeamMatchDetails(details.away);

    if (finalRow) {
      finalRow.homeTotalYellowCards = details.home.totalYellowCards;
      finalRow.homeTotalRedCards = details.home.totalRedCards;
      finalRow.awayTotalYellowCards = details.away.totalYellowCards;
      finalRow.awayTotalRedCards = details.away.totalRedCards;
      finalRow.homeGoalsDetailsJson = JSON.stringify(details.home.goalsDetails);
      finalRow.awayGoalsDetailsJson = JSON.stringify(details.away.goalsDetails);
      finalRow.homeCardsDetailsJson = JSON.stringify(details.home.cardsDetails);
      finalRow.awayCardsDetailsJson = JSON.stringify(details.away.cardsDetails);
      finalRow.homeInjuriesDetailsJson = JSON.stringify(details.home.injuriesDetails);
      finalRow.awayInjuriesDetailsJson = JSON.stringify(details.away.injuriesDetails);
      finalRow.homeSubstitutionsDetailsJson = JSON.stringify(details.home.substitutionsDetails);
      finalRow.awaySubstitutionsDetailsJson = JSON.stringify(details.away.substitutionsDetails);
      finalRow.playerOfMatchTeamId = selectedPlayerOfMatch?.teamId || null;
      finalRow.playerOfMatchTeamName = selectedPlayerOfMatch?.teamName || null;
      finalRow.playerOfMatchName = selectedPlayerOfMatch?.playerName || null;
      await this.worldCupMatchRepository.save(finalRow);
    }
  }

  /**
   * Resolves a fallback POTM from final match squad when no clear event winner exists.
   */
  private async resolveFinalPotmFallback(
    matchId: string,
    winnerTeamId: string,
  ): Promise<{ teamId: string; teamName: string; playerName: string; playerPosition: string } | null> {
    const winnerCaptain = await this.matchSquadRepository.findOne({
      where: {
        matchId,
        teamId: winnerTeamId,
        isCaptain: true,
      },
      order: {
        isOnField: 'DESC',
        skill: 'DESC',
      },
    });

    if (!winnerCaptain) {
      return null;
    }

    const team = await this.teamRepository.findOne({
      where: { teamId: winnerTeamId },
    });

    return {
      teamId: winnerCaptain.teamId,
      teamName: team?.name || winnerCaptain.teamId,
      playerName: winnerCaptain.playerName,
      playerPosition: winnerCaptain.position,
    };
  }

  /**
   * Returns one stat row for a tournament player, creating it when needed.
   */
  private async ensureWorldCupPlayerStatRow(params: {
    worldCupId: string;
    teamId: string;
    teamName: string;
    playerName: string;
    playerPosition?: string | null;
    statCache: Map<string, WorldCupPlayerStatEntity>;
  }): Promise<WorldCupPlayerStatEntity> {
    const key = `${params.teamId}:${this.normalizePlayerKey(params.playerName)}`;
    const cached = params.statCache.get(key);
    if (cached) {
      return cached;
    }

    const normalizedPlayerName = params.playerName.trim().toLowerCase();
    let teamPlayer = await this.teamPlayerRepository.findOne({
      where: { teamId: params.teamId, name: params.playerName },
    });

    if (!teamPlayer) {
      teamPlayer = await this.teamPlayerRepository
        .createQueryBuilder('player')
        .where('player.teamId = :teamId', { teamId: params.teamId })
        .andWhere('LOWER(player.name) = :name', { name: normalizedPlayerName })
        .getOne();
    }

    const created = this.worldCupPlayerStatRepository.create({
      worldCupId: params.worldCupId,
      teamId: params.teamId,
      teamName: params.teamName,
      playerId:
        teamPlayer?.playerId || this.buildSyntheticPlayerId(params.teamId, params.playerName),
      playerName: teamPlayer?.name || params.playerName,
      position: teamPlayer?.position || params.playerPosition || 'MF',
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
      playerOfMatch: 0,
    });

    params.statCache.set(key, created);
    return created;
  }

  /**
   * Normalized key for player-level maps.
   */
  private normalizePlayerKey(playerName: string): string {
    return playerName.trim().toLowerCase();
  }

  /**
   * Builds a deterministic fallback playerId for missing roster matches.
   */
  private buildSyntheticPlayerId(teamId: string, playerName: string): string {
    const normalized = playerName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 42);

    return `ply_${teamId}_${normalized || 'unknown'}`;
  }

  /**
   * Computes stage progression bonus per team (+1 for group stage participation +1 per knockout win).
   */
  private buildStageBonusByTeam(matches: WorldCupMatchEntity[]): Map<string, number> {
    const bonusByTeam = new Map<string, number>();
    const groupRegistered = new Set<string>();

    for (const match of matches) {
      const homeId = match.homeTeamId;
      const awayId = match.awayTeamId;

      if (match.stage === WorldCupStage.GROUP_STAGE) {
        if (!groupRegistered.has(homeId)) {
          bonusByTeam.set(homeId, (bonusByTeam.get(homeId) || 0) + 1);
          groupRegistered.add(homeId);
        }
        if (!groupRegistered.has(awayId)) {
          bonusByTeam.set(awayId, (bonusByTeam.get(awayId) || 0) + 1);
          groupRegistered.add(awayId);
        }
      }

      if (match.winnerTeamId && match.stage !== WorldCupStage.GROUP_STAGE) {
        bonusByTeam.set(match.winnerTeamId, (bonusByTeam.get(match.winnerTeamId) || 0) + 1);
      }
    }

    return bonusByTeam;
  }

  /**
   * Extracts finalist/champion/top-4 team ids from simulated match rows.
   */
  private extractAwardTeamBuckets(matches: WorldCupMatchEntity[]): {
    finalistTeamIds: Set<string>;
    championTeamId: string | null;
    topFourTeamIds: Set<string>;
  } {
    const finalMatch = matches.find((row) => row.stage === WorldCupStage.FINAL) || null;
    const thirdPlaceMatch = matches.find((row) => row.stage === WorldCupStage.THIRD_PLACE) || null;

    const finalistTeamIds = new Set<string>();
    if (finalMatch?.homeTeamId) {
      finalistTeamIds.add(finalMatch.homeTeamId);
    }
    if (finalMatch?.awayTeamId) {
      finalistTeamIds.add(finalMatch.awayTeamId);
    }

    const topFourTeamIds = new Set<string>(finalistTeamIds);
    if (thirdPlaceMatch?.homeTeamId) {
      topFourTeamIds.add(thirdPlaceMatch.homeTeamId);
    }
    if (thirdPlaceMatch?.awayTeamId) {
      topFourTeamIds.add(thirdPlaceMatch.awayTeamId);
    }

    return {
      finalistTeamIds,
      championTeamId: finalMatch?.winnerTeamId || null,
      topFourTeamIds,
    };
  }

  /**
   * Aggregates goals conceded by each team across all finished matches.
   */
  private buildGoalsAgainstByTeam(matches: WorldCupMatchEntity[]): Map<string, number> {
    const goalsAgainstByTeam = new Map<string, number>();

    for (const match of matches) {
      const homeConceded = match.awayGoals || 0;
      const awayConceded = match.homeGoals || 0;

      goalsAgainstByTeam.set(
        match.homeTeamId,
        (goalsAgainstByTeam.get(match.homeTeamId) || 0) + homeConceded,
      );
      goalsAgainstByTeam.set(
        match.awayTeamId,
        (goalsAgainstByTeam.get(match.awayTeamId) || 0) + awayConceded,
      );
    }

    return goalsAgainstByTeam;
  }

  /**
   * Resolves the Fair Play winner from disciplinary totals.
   * Eligibility rule: teams must reach knockout rounds (non-group stage).
   */
  private resolveFairPlayWinner(matches: WorldCupMatchEntity[]): FairPlayTeamScore | null {
    const fairPlayByTeam = new Map<string, FairPlayTeamScore>();

    for (const match of matches) {
      this.accumulateFairPlayFromMatchSide(
        fairPlayByTeam,
        match.homeTeamId,
        match.homeTeamName,
        match.homeTotalYellowCards || 0,
        match.homeTotalRedCards || 0,
        match.stage,
      );
      this.accumulateFairPlayFromMatchSide(
        fairPlayByTeam,
        match.awayTeamId,
        match.awayTeamName,
        match.awayTotalYellowCards || 0,
        match.awayTotalRedCards || 0,
        match.stage,
      );
    }

    const eligibleTeams = Array.from(fairPlayByTeam.values()).filter((team) => team.reachedKnockout);
    if (!eligibleTeams.length) {
      return null;
    }

    eligibleTeams.sort((leftTeam, rightTeam) => {
      return (
        leftTeam.fairPlayPoints - rightTeam.fairPlayPoints ||
        leftTeam.redCards - rightTeam.redCards ||
        leftTeam.yellowCards - rightTeam.yellowCards ||
        rightTeam.bestStageRank - leftTeam.bestStageRank ||
        leftTeam.teamName.localeCompare(rightTeam.teamName)
      );
    });

    return eligibleTeams[0];
  }

  /**
   * Aggregates one team disciplinary row into fair-play ranking map.
   */
  private accumulateFairPlayFromMatchSide(
    fairPlayByTeam: Map<string, FairPlayTeamScore>,
    teamId: string,
    teamName: string,
    yellowCards: number,
    redCards: number,
    stage: WorldCupStage,
  ): void {
    const currentRow = fairPlayByTeam.get(teamId) || {
      teamId,
      teamName,
      yellowCards: 0,
      redCards: 0,
      fairPlayPoints: 0,
      reachedKnockout: false,
      bestStageRank: 0,
    };

    currentRow.teamName = teamName;
    currentRow.yellowCards += yellowCards;
    currentRow.redCards += redCards;
    currentRow.fairPlayPoints = currentRow.yellowCards + currentRow.redCards * 3;
    currentRow.bestStageRank = Math.max(currentRow.bestStageRank, this.getStageRank(stage));
    if (stage !== WorldCupStage.GROUP_STAGE) {
      currentRow.reachedKnockout = true;
    }

    fairPlayByTeam.set(teamId, currentRow);
  }

  /**
   * Returns stage ranking weight for tie-breakers.
   */
  private getStageRank(stage: WorldCupStage): number {
    switch (stage) {
      case WorldCupStage.GROUP_STAGE:
        return 1;
      case WorldCupStage.ROUND_OF_32:
        return 2;
      case WorldCupStage.ROUND_OF_16:
        return 3;
      case WorldCupStage.QUARTER_FINALS:
        return 4;
      case WorldCupStage.SEMI_FINALS:
        return 5;
      case WorldCupStage.THIRD_PLACE:
        return 6;
      case WorldCupStage.FINAL:
        return 7;
      default:
        return 0;
    }
  }

  /**
   * Extracts final podium (champion/runner-up/third/fourth) from finished final + third-place rows.
   */
  private extractPodium(matches: WorldCupMatchEntity[]): {
    champion: WorldCupPodiumTeam | null;
    runnerUp: WorldCupPodiumTeam | null;
    thirdPlace: WorldCupPodiumTeam | null;
    fourthPlace: WorldCupPodiumTeam | null;
  } {
    const finalMatch =
      matches.find((row) => row.stage === WorldCupStage.FINAL && !row.isPending) || null;
    const thirdPlaceMatch =
      matches.find((row) => row.stage === WorldCupStage.THIRD_PLACE && !row.isPending) || null;

    let champion: WorldCupPodiumTeam | null = null;
    let runnerUp: WorldCupPodiumTeam | null = null;
    let thirdPlace: WorldCupPodiumTeam | null = null;
    let fourthPlace: WorldCupPodiumTeam | null = null;

    if (finalMatch && finalMatch.winnerTeamId) {
      champion = {
        teamId: finalMatch.winnerTeamId,
        teamName: finalMatch.winnerTeamName || '',
      };
      const runnerUpIsHome = finalMatch.winnerTeamId !== finalMatch.homeTeamId;
      runnerUp = runnerUpIsHome
        ? { teamId: finalMatch.homeTeamId, teamName: finalMatch.homeTeamName }
        : { teamId: finalMatch.awayTeamId, teamName: finalMatch.awayTeamName };
    }

    if (thirdPlaceMatch && thirdPlaceMatch.winnerTeamId) {
      thirdPlace = {
        teamId: thirdPlaceMatch.winnerTeamId,
        teamName: thirdPlaceMatch.winnerTeamName || '',
      };
      const fourthIsHome = thirdPlaceMatch.winnerTeamId !== thirdPlaceMatch.homeTeamId;
      fourthPlace = fourthIsHome
        ? { teamId: thirdPlaceMatch.homeTeamId, teamName: thirdPlaceMatch.homeTeamName }
        : { teamId: thirdPlaceMatch.awayTeamId, teamName: thirdPlaceMatch.awayTeamName };
    }

    return { champion, runnerUp, thirdPlace, fourthPlace };
  }

  private toJourneyMatchModel(match: WorldCupMatchEntity, teamId: string): WorldCupTeamJourneyMatch {
    const isHome = match.homeTeamId === teamId;
    const goalsFor = isHome ? match.homeGoals : match.awayGoals;
    const goalsAgainst = isHome ? match.awayGoals : match.homeGoals;

    let result = WorldCupTeamJourneyMatchResult.PENDING;
    if (!match.isPending && goalsFor !== null && goalsAgainst !== null) {
      if (goalsFor > goalsAgainst) {
        result = WorldCupTeamJourneyMatchResult.WIN;
      } else if (goalsFor < goalsAgainst) {
        result = WorldCupTeamJourneyMatchResult.LOSS;
      } else {
        result = WorldCupTeamJourneyMatchResult.DRAW;
      }
    }

    return {
      stage: match.stage as WorldCupStage,
      matchCode: match.matchCode,
      opponentTeamId: isHome ? match.awayTeamId : match.homeTeamId,
      opponentTeamName: isHome ? match.awayTeamName : match.homeTeamName,
      goalsFor,
      goalsAgainst,
      result,
      resolution: match.resolution as WorldCupMatchResolution,
      isPending: match.isPending,
    };
  }

  private resolveJourneyStageReached(matches: WorldCupMatchEntity[]): WorldCupTeamJourneyStage {
    if (!matches.length) {
      return WorldCupTeamJourneyStage.GROUP_STAGE;
    }

    const bestStage = matches
      .slice()
      .sort(
        (a, b) =>
          (WorldCupService.STAGE_RANK[b.stage as WorldCupStage] || 0) -
          (WorldCupService.STAGE_RANK[a.stage as WorldCupStage] || 0),
      )[0].stage as WorldCupStage;

    return this.toJourneyStage(bestStage);
  }

  private toJourneyStage(stage: WorldCupStage): WorldCupTeamJourneyStage {
    switch (stage) {
      case WorldCupStage.GROUP_STAGE:
        return WorldCupTeamJourneyStage.GROUP_STAGE;
      case WorldCupStage.ROUND_OF_32:
        return WorldCupTeamJourneyStage.ROUND_OF_32;
      case WorldCupStage.ROUND_OF_16:
        return WorldCupTeamJourneyStage.ROUND_OF_16;
      case WorldCupStage.QUARTER_FINALS:
        return WorldCupTeamJourneyStage.QUARTER_FINALS;
      case WorldCupStage.SEMI_FINALS:
        return WorldCupTeamJourneyStage.SEMI_FINALS;
      case WorldCupStage.THIRD_PLACE:
        return WorldCupTeamJourneyStage.THIRD_PLACE;
      case WorldCupStage.FINAL:
      default:
        return WorldCupTeamJourneyStage.FINAL;
    }
  }

  private findKnockoutElimination(
    matches: WorldCupMatchEntity[],
    teamId: string,
  ): WorldCupMatchEntity | null {
    const candidate = matches
      .slice()
      .reverse()
      .find(
        (match) =>
          !match.isPending &&
          match.stage !== WorldCupStage.GROUP_STAGE &&
          !!match.winnerTeamId &&
          match.winnerTeamId !== teamId,
      );

    return candidate || null;
  }

  private buildJourneySummary(params: {
    teamName: string;
    teamId: string;
    locale: AppLocale;
    worldCupStatus: WorldCupStatus;
    stageReached: WorldCupTeamJourneyStage;
    isChampion: boolean;
    isFinalPending: boolean;
    eliminatedByTeamName: string | null;
    finalMatch: WorldCupMatchEntity | null;
    eliminationMatch: WorldCupMatchEntity | null;
    hasMatches: boolean;
    hasKnockoutMatches: boolean;
  }): string {
    const {
      teamName,
      teamId,
      locale,
      worldCupStatus,
      stageReached,
      isChampion,
      isFinalPending,
      eliminatedByTeamName,
      finalMatch,
      eliminationMatch,
      hasMatches,
      hasKnockoutMatches,
    } = params;

    if (!hasMatches) {
      return this.i18nService.t('worldCup.journey.summary.noMatches', locale, { teamName });
    }

    if (isChampion && finalMatch) {
      const isHome = finalMatch.homeTeamId === teamId;
      const opponentName = isHome ? finalMatch.awayTeamName : finalMatch.homeTeamName;
      const scoreFor = isHome ? finalMatch.homeGoals : finalMatch.awayGoals;
      const scoreAgainst = isHome ? finalMatch.awayGoals : finalMatch.homeGoals;
      return this.i18nService.t('worldCup.journey.summary.champion', locale, {
        teamName,
        opponentName,
        scoreFor: scoreFor ?? '-',
        scoreAgainst: scoreAgainst ?? '-',
      });
    }

    if (isFinalPending && finalMatch) {
      const opponentName = finalMatch.homeTeamId === teamId ? finalMatch.awayTeamName : finalMatch.homeTeamName;
      const key =
        worldCupStatus === WorldCupStatus.FINAL_ACTIVE
          ? 'worldCup.journey.summary.finalActive'
          : 'worldCup.journey.summary.finalPending';

      return this.i18nService.t(key, locale, { teamName, opponentName });
    }

    if (finalMatch && !finalMatch.isPending && eliminatedByTeamName) {
      const isHome = finalMatch.homeTeamId === teamId;
      const scoreFor = isHome ? finalMatch.homeGoals : finalMatch.awayGoals;
      const scoreAgainst = isHome ? finalMatch.awayGoals : finalMatch.homeGoals;
      return this.i18nService.t('worldCup.journey.summary.finalLost', locale, {
        teamName,
        opponentName: eliminatedByTeamName,
        scoreFor: scoreFor ?? '-',
        scoreAgainst: scoreAgainst ?? '-',
      });
    }

    if (eliminationMatch && eliminatedByTeamName) {
      const isHome = eliminationMatch.homeTeamId === teamId;
      const scoreFor = isHome ? eliminationMatch.homeGoals : eliminationMatch.awayGoals;
      const scoreAgainst = isHome ? eliminationMatch.awayGoals : eliminationMatch.homeGoals;
      const stageName = this.i18nService.t(`worldCup.stage.${eliminationMatch.stage}`, locale);

      return this.i18nService.t('worldCup.journey.summary.eliminatedBy', locale, {
        teamName,
        stageName,
        opponentName: eliminatedByTeamName,
        scoreFor: scoreFor ?? '-',
        scoreAgainst: scoreAgainst ?? '-',
      });
    }

    if (!hasKnockoutMatches && stageReached === WorldCupTeamJourneyStage.GROUP_STAGE) {
      return this.i18nService.t('worldCup.journey.summary.groupExit', locale, { teamName });
    }

    return this.i18nService.t('worldCup.journey.summary.reached', locale, {
      teamName,
      stageName: this.i18nService.t(`worldCup.stage.${stageReached}`, locale),
    });
  }

  private hasWorldCupTitleInHistory(titlesJson: string | null | undefined): boolean {
    if (!titlesJson) {
      return false;
    }

    try {
      const parsed = JSON.parse(titlesJson);
      if (!Array.isArray(parsed)) {
        return false;
      }

      return parsed.some((item) => {
        if (typeof item === 'string') {
          return /^\d{4}$/.test(item.trim());
        }

        if (!item || typeof item !== 'object') {
          return false;
        }

        const org = String((item as { org?: unknown }).org || '').trim().toLowerCase();
        const tournament = String((item as { tournament?: unknown }).tournament || '')
          .trim()
          .toLowerCase();
        const count = Number((item as { count?: unknown }).count || 0);

        return org === 'fifa' && tournament === 'world cup' && count > 0;
      });
    } catch {
      return false;
    }
  }

  private async runSimulation(worldCupId: string, selectedTeam: TeamEntity): Promise<{
    groupRows: WorldCupGroupStandingEntity[];
    matches: WorldCupMatchEntity[];
    playerStats: WorldCupPlayerStatEntity[];
    finalHome: TeamEntity;
    finalAway: TeamEntity;
    notes: string[];
  }> {
    const teams = await this.teamRepository.find({ order: { rating: 'DESC', name: 'ASC' } });
    if (teams.length < 32) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    const championIds = new Set(
      (await this.teamHistoryRepository.find())
        .filter((history) => this.hasWorldCupTitleInHistory(history.titlesJson))
        .map((history) => history.teamId),
    );

    const { groups, usedConfederationFallback } = this.buildGroups(teams, championIds);
    const standings = this.createInitialStandings(worldCupId, groups);

    const notes: string[] = [];
    if (usedConfederationFallback) {
      notes.push('Confederation fallback was used in at least one group assignment.');
    }

    const playersByTeam = await this.loadPlayersByTeam();
    const playerTallies = new Map<string, PlayerTally>();
    const matches: WorldCupMatchEntity[] = [];
    const selectedGroup = Array.from(groups.entries()).find(([, groupTeams]) =>
      groupTeams.some((team) => team.teamId === selectedTeam.teamId),
    );

    if (!selectedGroup) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    const [selectedGroupName] = selectedGroup;

    for (const [groupName, groupTeams] of groups.entries()) {
      if (groupName === selectedGroupName) {
        continue;
      }

      this.simulateGroupRoundRobin({
        worldCupId,
        groupName,
        groupTeams,
        standings,
        playersByTeam,
        playerTallies,
        matches,
      });
    }

    const selectedGroupTeams = groups.get(selectedGroupName) || [];
    this.simulateGroupRoundRobin({
      worldCupId,
      groupName: selectedGroupName,
      groupTeams: selectedGroupTeams,
      standings,
      playersByTeam,
      playerTallies,
      matches,
      selectedTeamId: selectedTeam.teamId,
      guaranteeSelectedQualification: true,
    });
    notes.push(
      `Selected team group (${selectedGroupName}) was simulated last with guaranteed qualification.`,
    );

    const rankedByGroup = this.rankGroups(standings, groups);
    const qualified = this.pickQualifiedTeams(rankedByGroup);
    if (!qualified.some((team) => team.teamId === selectedTeam.teamId)) {
      this.forceSelectedTeamQualification(selectedTeam, qualified, standings);
      notes.push(
        'Selected team qualification fallback was applied after group simulation consistency check.',
      );
    }

    const roundOf32 = this.simulateKnockoutRound({
      worldCupId,
      participants: qualified,
      stage: WorldCupStage.ROUND_OF_32,
      forceAdvanceTeamId: selectedTeam.teamId,
      codePrefix: 'R32',
      playersByTeam,
      playerTallies,
    });
    matches.push(...roundOf32.matches);

    const roundOf16 = this.simulateKnockoutRound({
      worldCupId,
      participants: roundOf32.winners,
      stage: WorldCupStage.ROUND_OF_16,
      forceAdvanceTeamId: selectedTeam.teamId,
      codePrefix: 'R16',
      playersByTeam,
      playerTallies,
    });
    matches.push(...roundOf16.matches);

    const quarterFinals = this.simulateKnockoutRound({
      worldCupId,
      participants: roundOf16.winners,
      stage: WorldCupStage.QUARTER_FINALS,
      forceAdvanceTeamId: selectedTeam.teamId,
      codePrefix: 'QF',
      playersByTeam,
      playerTallies,
    });
    matches.push(...quarterFinals.matches);

    const semiFinals = this.simulateKnockoutRound({
      worldCupId,
      participants: quarterFinals.winners,
      stage: WorldCupStage.SEMI_FINALS,
      forceAdvanceTeamId: selectedTeam.teamId,
      codePrefix: 'SF',
      playersByTeam,
      playerTallies,
    });
    matches.push(...semiFinals.matches);

    const thirdPlace = this.simulateKnockoutRound({
      worldCupId,
      participants: semiFinals.losers,
      stage: WorldCupStage.THIRD_PLACE,
      forceAdvanceTeamId: null,
      codePrefix: 'TP',
      playersByTeam,
      playerTallies,
    });
    matches.push(...thirdPlace.matches);

    const finalists = semiFinals.winners;
    if (finalists.length !== 2) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    matches.push(
      this.worldCupMatchRepository.create({
        worldCupId,
        stage: WorldCupStage.FINAL,
        groupName: null,
        matchCode: 'FINAL-1',
        homeTeamId: finalists[0].teamId,
        homeTeamName: finalists[0].name,
        awayTeamId: finalists[1].teamId,
        awayTeamName: finalists[1].name,
        homeGoals: null,
        awayGoals: null,
        winnerTeamId: null,
        winnerTeamName: null,
        resolution: WorldCupMatchResolution.PENDING,
        isPending: true,
      }),
    );

    const groupRows = Array.from(standings.values()).map((row) =>
      this.worldCupGroupStandingRepository.create({
        worldCupId: row.worldCupId,
        groupName: row.groupName,
        teamId: row.teamId,
        teamName: row.teamName,
        confederation: row.confederation,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
        position: row.position,
        isQualified: row.isQualified,
        isBestThird: row.isBestThird,
      }),
    );

    const playerStats = Array.from(playerTallies.values()).map((tally) =>
      this.worldCupPlayerStatRepository.create({
        worldCupId: tally.worldCupId,
        teamId: tally.teamId,
        teamName: tally.teamName,
        playerId: tally.playerId,
        playerName: tally.playerName,
        position: tally.position,
        goals: tally.goals,
        assists: tally.assists,
        cleanSheets: tally.cleanSheets,
        yellowCards: tally.yellowCards,
        redCards: tally.redCards,
        minutesPlayed: tally.minutesPlayed,
        playerOfMatch: tally.playerOfMatch,
      }),
    );

    return {
      groupRows,
      matches,
      playerStats,
      finalHome: finalists[0],
      finalAway: finalists[1],
      notes,
    };
  }

  private buildGroups(
    teams: TeamEntity[],
    championIds: Set<string>,
  ): { groups: Map<string, TeamEntity[]>; usedConfederationFallback: boolean } {
    const groups = new Map<string, TeamEntity[]>();
    WorldCupService.GROUP_NAMES.forEach((groupName) => groups.set(groupName, []));

    const remaining = new Map(teams.map((team) => [team.teamId, team]));
    const champions = this.shuffle(teams.filter((team) => championIds.has(team.teamId)));

    const heads: TeamEntity[] = [];
    while (heads.length < WorldCupService.GROUP_NAMES.length && champions.length) {
      const candidate = champions.shift();
      if (candidate && remaining.has(candidate.teamId)) {
        heads.push(candidate);
        remaining.delete(candidate.teamId);
      }
    }

    while (heads.length < WorldCupService.GROUP_NAMES.length) {
      const pool = Array.from(remaining.values());
      if (!pool.length) {
        break;
      }
      const picked = pool[this.randomInt(0, pool.length - 1)];
      heads.push(picked);
      remaining.delete(picked.teamId);
    }

    WorldCupService.GROUP_NAMES.forEach((groupName, index) => {
      const head = heads[index];
      if (head) {
        groups.get(groupName)?.push(head);
      }
    });

    let usedConfederationFallback = false;
    while (remaining.size > 0) {
      for (const groupName of WorldCupService.GROUP_NAMES) {
        const bucket = groups.get(groupName) || [];
        if (bucket.length >= 4 || remaining.size === 0) {
          continue;
        }

        const remainingTeams = Array.from(remaining.values());
        const preferred = remainingTeams.filter((team) => this.canPlaceInGroup(bucket, team));
        const pool = preferred.length ? preferred : remainingTeams;

        if (!preferred.length) {
          usedConfederationFallback = true;
        }

        const picked = pool[this.randomInt(0, pool.length - 1)];
        bucket.push(picked);
        groups.set(groupName, bucket);
        remaining.delete(picked.teamId);
      }
    }

    return { groups, usedConfederationFallback };
  }

  private canPlaceInGroup(group: TeamEntity[], team: TeamEntity): boolean {
    const sameConfCount = group.filter(
      (entry) => entry.footballAssociation === team.footballAssociation,
    ).length;
    return sameConfCount < 2;
  }

  private createInitialStandings(
    worldCupId: string,
    groups: Map<string, TeamEntity[]>,
  ): Map<string, StandingAccumulator> {
    const table = new Map<string, StandingAccumulator>();

    for (const [groupName, teams] of groups.entries()) {
      teams.forEach((team) => {
        table.set(team.teamId, {
          worldCupId,
          groupName,
          teamId: team.teamId,
          teamName: team.name,
          confederation: team.footballAssociation,
          rating: team.rating,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          position: 4,
          isQualified: false,
          isBestThird: false,
        });
      });
    }

    return table;
  }

  private simulateGroupMatch(homeTeam: TeamEntity, awayTeam: TeamEntity): SimulatedMatch {
    const homeGoals = this.simulateGoals(homeTeam.rating, awayTeam.rating);
    const awayGoals = this.simulateGoals(awayTeam.rating, homeTeam.rating);

    let winner: TeamEntity | null = null;
    if (homeGoals > awayGoals) {
      winner = homeTeam;
    } else if (awayGoals > homeGoals) {
      winner = awayTeam;
    }

    return {
      homeGoals,
      awayGoals,
      homePenaltyGoals: null,
      awayPenaltyGoals: null,
      winner,
      resolution: WorldCupMatchResolution.REGULAR_TIME,
      details: null,
    };
  }

  /**
   * Simulates all 6 fixtures for one 4-team group and applies the result to standings/tallies.
   * If `guaranteeSelectedQualification` is true, matches involving selected team are adjusted
   * to guarantee group qualification by avoiding losses in that group.
   */
  private simulateGroupRoundRobin(params: {
    worldCupId: string;
    groupName: string;
    groupTeams: TeamEntity[];
    standings: Map<string, StandingAccumulator>;
    playersByTeam: Map<string, TeamPlayerEntity[]>;
    playerTallies: Map<string, PlayerTally>;
    matches: WorldCupMatchEntity[];
    selectedTeamId?: string;
    guaranteeSelectedQualification?: boolean;
  }): void {
    const pairings: Array<[number, number]> = [
      [0, 1],
      [2, 3],
      [0, 2],
      [1, 3],
      [0, 3],
      [1, 2],
    ];

    pairings.forEach(([homeIndex, awayIndex], matchIndex) => {
      const homeTeam = params.groupTeams[homeIndex];
      const awayTeam = params.groupTeams[awayIndex];
      if (!homeTeam || !awayTeam) {
        return;
      }

      const result =
        params.guaranteeSelectedQualification && params.selectedTeamId
          ? this.simulateGroupMatchWithSelectedGuarantee(
              homeTeam,
              awayTeam,
              params.selectedTeamId,
            )
          : this.simulateGroupMatch(homeTeam, awayTeam);

      const details = this.applyPlayerTallies(
        params.worldCupId,
        homeTeam,
        awayTeam,
        result.homeGoals,
        result.awayGoals,
        result.winner?.teamId || null,
        params.playersByTeam,
        params.playerTallies,
      );
      result.details = details;

      params.matches.push(
        this.worldCupMatchRepository.create({
          worldCupId: params.worldCupId,
          stage: WorldCupStage.GROUP_STAGE,
          groupName: params.groupName,
          matchCode: `${params.groupName}-M${matchIndex + 1}`,
          homeTeamId: homeTeam.teamId,
          homeTeamName: homeTeam.name,
          awayTeamId: awayTeam.teamId,
          awayTeamName: awayTeam.name,
          homeGoals: result.homeGoals,
          awayGoals: result.awayGoals,
          homePenaltyGoals: result.homePenaltyGoals,
          awayPenaltyGoals: result.awayPenaltyGoals,
          winnerTeamId: result.winner?.teamId || null,
          winnerTeamName: result.winner?.name || null,
          resolution: WorldCupMatchResolution.REGULAR_TIME,
          isPending: false,
          playerOfMatchTeamId: details.playerOfMatch?.teamId || null,
          playerOfMatchTeamName: details.playerOfMatch?.teamName || null,
          playerOfMatchName: details.playerOfMatch?.playerName || null,
          homeTotalYellowCards: details.home.totalYellowCards,
          homeTotalRedCards: details.home.totalRedCards,
          awayTotalYellowCards: details.away.totalYellowCards,
          awayTotalRedCards: details.away.totalRedCards,
          homeGoalsDetailsJson: JSON.stringify(details.home.goalsDetails),
          awayGoalsDetailsJson: JSON.stringify(details.away.goalsDetails),
          homeCardsDetailsJson: JSON.stringify(details.home.cardsDetails),
          awayCardsDetailsJson: JSON.stringify(details.away.cardsDetails),
          homeInjuriesDetailsJson: JSON.stringify(details.home.injuriesDetails),
          awayInjuriesDetailsJson: JSON.stringify(details.away.injuriesDetails),
          homeSubstitutionsDetailsJson: JSON.stringify(details.home.substitutionsDetails),
          awaySubstitutionsDetailsJson: JSON.stringify(details.away.substitutionsDetails),
        }),
      );

      this.applyGroupResult(
        params.standings.get(homeTeam.teamId),
        params.standings.get(awayTeam.teamId),
        result.homeGoals,
        result.awayGoals,
      );
    });
  }

  /**
   * Applies a controlled adjustment on selected team fixtures so selected team
   * does not lose in its group simulation pass.
   */
  private simulateGroupMatchWithSelectedGuarantee(
    homeTeam: TeamEntity,
    awayTeam: TeamEntity,
    selectedTeamId: string,
  ): SimulatedMatch {
    const base = this.simulateGroupMatch(homeTeam, awayTeam);
    const isSelectedHome = homeTeam.teamId === selectedTeamId;
    const isSelectedAway = awayTeam.teamId === selectedTeamId;

    if ((!isSelectedHome && !isSelectedAway) || base.winner?.teamId === selectedTeamId) {
      return base;
    }

    if (isSelectedHome) {
      const adjusted = this.ensureWinningScore(base.homeGoals, base.awayGoals);
      return {
        homeGoals: adjusted.goalsFor,
        awayGoals: adjusted.goalsAgainst,
        homePenaltyGoals: null,
        awayPenaltyGoals: null,
        winner: homeTeam,
        resolution: WorldCupMatchResolution.REGULAR_TIME,
        details: null,
      };
    }

    const adjusted = this.ensureWinningScore(base.awayGoals, base.homeGoals);
    return {
      homeGoals: adjusted.goalsAgainst,
      awayGoals: adjusted.goalsFor,
      homePenaltyGoals: null,
      awayPenaltyGoals: null,
      winner: awayTeam,
      resolution: WorldCupMatchResolution.REGULAR_TIME,
      details: null,
    };
  }

  private ensureWinningScore(goalsFor: number, goalsAgainst: number): { goalsFor: number; goalsAgainst: number } {
    if (goalsFor > goalsAgainst) {
      return { goalsFor, goalsAgainst };
    }

    if (goalsAgainst >= 8) {
      return { goalsFor: 8, goalsAgainst: 7 };
    }

    return {
      goalsFor: goalsAgainst + 1,
      goalsAgainst,
    };
  }

  private applyGroupResult(
    home: StandingAccumulator | undefined,
    away: StandingAccumulator | undefined,
    homeGoals: number,
    awayGoals: number,
  ): void {
    if (!home || !away) {
      return;
    }

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (awayGoals > homeGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  private rankGroups(
    standings: Map<string, StandingAccumulator>,
    groups: Map<string, TeamEntity[]>,
  ): Map<string, StandingAccumulator[]> {
    const ranked = new Map<string, StandingAccumulator[]>();

    for (const [groupName, teams] of groups.entries()) {
      const rows = teams
        .map((team) => standings.get(team.teamId))
        .filter((row): row is StandingAccumulator => !!row)
        .sort((a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          b.rating - a.rating ||
          a.teamName.localeCompare(b.teamName),
        );

      rows.forEach((row, index) => {
        row.position = index + 1;
      });

      ranked.set(groupName, rows);
    }

    return ranked;
  }

  private pickQualifiedTeams(rankedByGroup: Map<string, StandingAccumulator[]>): TeamEntity[] {
    const firstAndSecond: StandingAccumulator[] = [];
    const thirds: StandingAccumulator[] = [];

    for (const rows of rankedByGroup.values()) {
      if (rows[0]) {
        rows[0].isQualified = true;
        firstAndSecond.push(rows[0]);
      }
      if (rows[1]) {
        rows[1].isQualified = true;
        firstAndSecond.push(rows[1]);
      }
      if (rows[2]) {
        thirds.push(rows[2]);
      }
    }

    const bestThirds = thirds
      .sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        b.rating - a.rating ||
        a.teamName.localeCompare(b.teamName),
      )
      .slice(0, 8);

    bestThirds.forEach((row) => {
      row.isQualified = true;
      row.isBestThird = true;
    });

    const qualifiedRows = [...firstAndSecond, ...bestThirds];

    const shuffled = this.shuffle(
      qualifiedRows.map((row) =>
        this.teamRepository.create({
          teamId: row.teamId,
          name: row.teamName,
          footballAssociation: row.confederation,
          rating: row.rating,
          coach: '',
          captain: '',
          groupName: row.groupName,
          strategy: null as any,
          formation: null as any,
        }),
      ),
    );

    return shuffled;
  }

  private forceSelectedTeamQualification(
    selectedTeam: TeamEntity,
    qualified: TeamEntity[],
    standings: Map<string, StandingAccumulator>,
  ): void {
    if (qualified.some((team) => team.teamId === selectedTeam.teamId)) {
      return;
    }

    if (qualified.length === 0) {
      qualified.push(selectedTeam);
      return;
    }

    qualified.pop();
    qualified.unshift(selectedTeam);

    const selectedStanding = standings.get(selectedTeam.teamId);
    if (selectedStanding) {
      selectedStanding.isQualified = true;
      if (selectedStanding.position > 3) {
        selectedStanding.position = 3;
      }
    }
  }

  private simulateKnockoutRound(params: {
    worldCupId: string;
    participants: TeamEntity[];
    stage: WorldCupStage;
    forceAdvanceTeamId: string | null;
    codePrefix: string;
    playersByTeam: Map<string, TeamPlayerEntity[]>;
    playerTallies: Map<string, PlayerTally>;
  }): SimulatedKnockoutRound {
    const participants = this.shuffle([...params.participants]);
    const winners: TeamEntity[] = [];
    const losers: TeamEntity[] = [];
    const matches: WorldCupMatchEntity[] = [];

    if (params.forceAdvanceTeamId) {
      const forcedIndex = participants.findIndex((team) => team.teamId === params.forceAdvanceTeamId);
      if (forcedIndex > 0) {
        const [forcedTeam] = participants.splice(forcedIndex, 1);
        participants.unshift(forcedTeam);
      }
    }

    for (let i = 0; i < participants.length; i += 2) {
      const home = participants[i];
      const away = participants[i + 1];
      if (!home || !away) {
        continue;
      }

      const forceWinnerId =
        params.forceAdvanceTeamId &&
        (home.teamId === params.forceAdvanceTeamId || away.teamId === params.forceAdvanceTeamId)
          ? params.forceAdvanceTeamId
          : null;

      const result = this.simulateKnockoutMatch(home, away, forceWinnerId);
      const winner = result.winner || (home.rating >= away.rating ? home : away);
      const loser = winner.teamId === home.teamId ? away : home;

      winners.push(winner);
      losers.push(loser);

      const details = this.applyPlayerTallies(
        params.worldCupId,
        home,
        away,
        result.homeGoals,
        result.awayGoals,
        winner.teamId,
        params.playersByTeam,
        params.playerTallies,
      );
      result.details = details;

      matches.push(
        this.worldCupMatchRepository.create({
          worldCupId: params.worldCupId,
          stage: params.stage,
          groupName: null,
          matchCode: `${params.codePrefix}-${i / 2 + 1}`,
          homeTeamId: home.teamId,
          homeTeamName: home.name,
          awayTeamId: away.teamId,
          awayTeamName: away.name,
          homeGoals: result.homeGoals,
          awayGoals: result.awayGoals,
          homePenaltyGoals: result.homePenaltyGoals,
          awayPenaltyGoals: result.awayPenaltyGoals,
          winnerTeamId: winner.teamId,
          winnerTeamName: winner.name,
          resolution: result.resolution,
          isPending: false,
          playerOfMatchTeamId: details.playerOfMatch?.teamId || null,
          playerOfMatchTeamName: details.playerOfMatch?.teamName || null,
          playerOfMatchName: details.playerOfMatch?.playerName || null,
          homeTotalYellowCards: details.home.totalYellowCards,
          homeTotalRedCards: details.home.totalRedCards,
          awayTotalYellowCards: details.away.totalYellowCards,
          awayTotalRedCards: details.away.totalRedCards,
          homeGoalsDetailsJson: JSON.stringify(details.home.goalsDetails),
          awayGoalsDetailsJson: JSON.stringify(details.away.goalsDetails),
          homeCardsDetailsJson: JSON.stringify(details.home.cardsDetails),
          awayCardsDetailsJson: JSON.stringify(details.away.cardsDetails),
          homeInjuriesDetailsJson: JSON.stringify(details.home.injuriesDetails),
          awayInjuriesDetailsJson: JSON.stringify(details.away.injuriesDetails),
          homeSubstitutionsDetailsJson: JSON.stringify(details.home.substitutionsDetails),
          awaySubstitutionsDetailsJson: JSON.stringify(details.away.substitutionsDetails),
        }),
      );
    }

    return { matches, winners, losers };
  }

  private simulateKnockoutMatch(
    home: TeamEntity,
    away: TeamEntity,
    forceWinnerId: string | null,
  ): SimulatedMatch {
    let homeGoals = this.simulateGoals(home.rating, away.rating);
    let awayGoals = this.simulateGoals(away.rating, home.rating);

    const preferredWinner = forceWinnerId
      ? forceWinnerId
      : Math.random() < this.clamp(0.25, 0.75, 0.5 + (home.rating - away.rating) / 200)
        ? home.teamId
        : away.teamId;

    if (homeGoals !== awayGoals) {
      let winner = homeGoals > awayGoals ? home : away;
      if (winner.teamId !== preferredWinner) {
        if (preferredWinner === home.teamId) {
          homeGoals = this.ensureAbove(homeGoals, awayGoals);
          winner = home;
        } else {
          awayGoals = this.ensureAbove(awayGoals, homeGoals);
          winner = away;
        }
      }

      return {
        homeGoals,
        awayGoals,
        homePenaltyGoals: null,
        awayPenaltyGoals: null,
        winner,
        resolution: WorldCupMatchResolution.REGULAR_TIME,
        details: null,
      };
    }

    const winner = preferredWinner === home.teamId ? home : away;
    const resolution = Math.random() < 0.5 ? WorldCupMatchResolution.EXTRA_TIME : WorldCupMatchResolution.PENALTIES;

    if (resolution === WorldCupMatchResolution.EXTRA_TIME) {
      if (winner.teamId === home.teamId) {
        homeGoals = this.ensureAbove(homeGoals, awayGoals);
      } else {
        awayGoals = this.ensureAbove(awayGoals, homeGoals);
      }

      return {
        homeGoals,
        awayGoals,
        homePenaltyGoals: null,
        awayPenaltyGoals: null,
        winner,
        resolution,
        details: null,
      };
    }

    const penalties = this.simulatePenaltyShootout(winner.teamId === home.teamId);

    return {
      homeGoals,
      awayGoals,
      homePenaltyGoals: penalties.homePenaltyGoals,
      awayPenaltyGoals: penalties.awayPenaltyGoals,
      winner,
      resolution: WorldCupMatchResolution.PENALTIES,
      details: null,
    };
  }

  private ensureAbove(candidateGoals: number, otherGoals: number): number {
    const minRequired = otherGoals + 1;
    if (candidateGoals >= minRequired) {
      return Math.min(8, candidateGoals);
    }
    return Math.min(8, minRequired);
  }

  private simulatePenaltyShootout(winnerIsHome: boolean): {
    homePenaltyGoals: number;
    awayPenaltyGoals: number;
  } {
    const losingScore = this.randomInt(2, 4);
    const winningScore = this.randomInt(Math.max(3, losingScore + 1), 5);

    if (winnerIsHome) {
      return { homePenaltyGoals: winningScore, awayPenaltyGoals: losingScore };
    }

    return { homePenaltyGoals: losingScore, awayPenaltyGoals: winningScore };
  }

  private simulateGoals(teamRating: number, opponentRating: number): number {
    const base = this.clamp(0.2, 2.8, 1.2 + (teamRating - opponentRating) / 55 + this.randomFloat(-0.25, 0.25));
    const goals = this.poisson(base);
    return Math.min(8, goals);
  }

  private poisson(lambda: number): number {
    const limit = Math.exp(-lambda);
    let product = 1;
    let k = 0;

    do {
      k += 1;
      product *= Math.random();
    } while (product > limit && k < 20);

    return Math.max(0, k - 1);
  }

  private async loadPlayersByTeam(): Promise<Map<string, TeamPlayerEntity[]>> {
    const rows = await this.teamPlayerRepository.find({ order: { teamId: 'ASC', position: 'ASC', name: 'ASC' } });
    const byTeam = new Map<string, TeamPlayerEntity[]>();

    for (const row of rows) {
      if (!byTeam.has(row.teamId)) {
        byTeam.set(row.teamId, []);
      }
      byTeam.get(row.teamId)?.push(row);
    }

    return byTeam;
  }

  private applyPlayerTallies(
    worldCupId: string,
    homeTeam: TeamEntity,
    awayTeam: TeamEntity,
    homeGoals: number,
    awayGoals: number,
    winnerTeamId: string | null,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
    tallyMap: Map<string, PlayerTally>,
  ): SimulatedMatchDetails {
    const contributions = new Map<string, MatchPlayerContribution>();
    const details: SimulatedMatchDetails = {
      home: this.createEmptyTeamMatchDetails(),
      away: this.createEmptyTeamMatchDetails(),
      playerOfMatch: null,
    };

    this.addGoalsToTeam(
      worldCupId,
      homeTeam,
      homeGoals,
      playersByTeam,
      tallyMap,
      contributions,
      details.home,
    );
    this.addGoalsToTeam(
      worldCupId,
      awayTeam,
      awayGoals,
      playersByTeam,
      tallyMap,
      contributions,
      details.away,
    );

    this.addRandomCardsToTeam(worldCupId, homeTeam, playersByTeam, tallyMap, details.home);
    this.addRandomCardsToTeam(worldCupId, awayTeam, playersByTeam, tallyMap, details.away);
    this.addRandomInjuriesToTeam(homeTeam, playersByTeam, details.home);
    this.addRandomInjuriesToTeam(awayTeam, playersByTeam, details.away);
    this.addRandomSubstitutionsToTeam(homeTeam, playersByTeam, details.home);
    this.addRandomSubstitutionsToTeam(awayTeam, playersByTeam, details.away);

    const homePlayers = playersByTeam.get(homeTeam.teamId) || [];
    const awayPlayers = playersByTeam.get(awayTeam.teamId) || [];

    const homeGoalkeeper = homePlayers.find((player) => player.position === 'GK');
    const awayGoalkeeper = awayPlayers.find((player) => player.position === 'GK');

    if (awayGoals === 0 && homeGoalkeeper) {
      const stat = this.getOrCreatePlayerTally(worldCupId, homeTeam, homeGoalkeeper, tallyMap);
      stat.cleanSheets += 1;
      this.bumpContribution(contributions, homeTeam, homeGoalkeeper, { cleanSheets: 1 });
    }

    if (homeGoals === 0 && awayGoalkeeper) {
      const stat = this.getOrCreatePlayerTally(worldCupId, awayTeam, awayGoalkeeper, tallyMap);
      stat.cleanSheets += 1;
      this.bumpContribution(contributions, awayTeam, awayGoalkeeper, { cleanSheets: 1 });
    }

    const playerOfMatch = this.pickPlayerOfMatch(
      contributions,
      winnerTeamId,
      homeTeam,
      awayTeam,
      playersByTeam,
    );
    if (playerOfMatch) {
      const stat = this.getOrCreatePlayerTally(
        worldCupId,
        playerOfMatch.team,
        playerOfMatch.player,
        tallyMap,
      );
      stat.playerOfMatch += 1;
      details.playerOfMatch = {
        playerName: playerOfMatch.player.name,
        teamId: playerOfMatch.team.teamId,
        teamName: playerOfMatch.team.name,
      };
    }

    this.sortTeamMatchDetails(details.home);
    this.sortTeamMatchDetails(details.away);

    return details;
  }

  private addGoalsToTeam(
    worldCupId: string,
    team: TeamEntity,
    goalCount: number,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
    tallyMap: Map<string, PlayerTally>,
    contributions: Map<string, MatchPlayerContribution>,
    teamDetails: TeamMatchDetails,
  ): void {
    if (goalCount <= 0) {
      return;
    }

    const squad = playersByTeam.get(team.teamId) || [];
    if (!squad.length) {
      return;
    }

    const attackingPool = squad.filter((player) => player.position !== 'GK');
    const scorerPool = attackingPool.length ? attackingPool : squad;

    for (let index = 0; index < goalCount; index += 1) {
      const scorer = scorerPool[this.randomInt(0, scorerPool.length - 1)];
      const minute = this.randomInt(1, 90);
      const scorerStat = this.getOrCreatePlayerTally(worldCupId, team, scorer, tallyMap);
      scorerStat.goals += 1;
      scorerStat.minutesPlayed += 90;
      this.bumpContribution(contributions, team, scorer, { goals: 1 });
      teamDetails.goalsDetails.push({ playerName: scorer.name, minute });

      if (Math.random() < 0.45) {
        const assistPool = scorerPool.filter((candidate) => candidate.playerId !== scorer.playerId);
        if (assistPool.length) {
          const assister = assistPool[this.randomInt(0, assistPool.length - 1)];
          const assisterStat = this.getOrCreatePlayerTally(worldCupId, team, assister, tallyMap);
          assisterStat.assists += 1;
          assisterStat.minutesPlayed += 90;
          this.bumpContribution(contributions, team, assister, { assists: 1 });
        }
      }
    }
  }

  private addRandomCardsToTeam(
    worldCupId: string,
    team: TeamEntity,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
    tallyMap: Map<string, PlayerTally>,
    teamDetails: TeamMatchDetails,
  ): void {
    const squad = playersByTeam.get(team.teamId) || [];
    if (!squad.length) {
      return;
    }

    const pool = squad.filter((player) => player.position !== 'GK');
    const cardPool = pool.length ? pool : squad;

    let yellowCount = 0;
    if (Math.random() < 0.34) {
      yellowCount += 1;
    }
    if (Math.random() < 0.15) {
      yellowCount += 1;
    }
    if (Math.random() < 0.05) {
      yellowCount += 1;
    }

    const redCount = Math.random() < 0.08 ? 1 : 0;

    for (let index = 0; index < yellowCount; index += 1) {
      const player = cardPool[this.randomInt(0, cardPool.length - 1)];
      const minute = this.randomInt(6, 90);
      teamDetails.cardsDetails.push({
        playerName: player.name,
        minute,
        cardType: MatchCardType.YELLOW,
      });

      const stat = this.getOrCreatePlayerTally(worldCupId, team, player, tallyMap);
      stat.yellowCards += 1;
    }

    for (let index = 0; index < redCount; index += 1) {
      const player = cardPool[this.randomInt(0, cardPool.length - 1)];
      const minute = this.randomInt(12, 90);
      teamDetails.cardsDetails.push({
        playerName: player.name,
        minute,
        cardType: MatchCardType.RED,
      });

      const stat = this.getOrCreatePlayerTally(worldCupId, team, player, tallyMap);
      stat.redCards += 1;
    }

    teamDetails.totalYellowCards += yellowCount;
    teamDetails.totalRedCards += redCount;
  }

  private addRandomInjuriesToTeam(
    team: TeamEntity,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
    teamDetails: TeamMatchDetails,
  ): void {
    const squad = playersByTeam.get(team.teamId) || [];
    if (!squad.length) {
      return;
    }

    const pool = squad.filter((player) => player.position !== 'GK');
    const injuryPool = pool.length ? pool : squad;
    let injuries = 0;
    if (Math.random() < 0.12) {
      injuries += 1;
    }
    if (Math.random() < 0.03) {
      injuries += 1;
    }

    for (let index = 0; index < injuries; index += 1) {
      const player = injuryPool[this.randomInt(0, injuryPool.length - 1)];
      teamDetails.injuriesDetails.push({
        playerName: player.name,
        minute: this.randomInt(20, 90),
      });
    }
  }

  private addRandomSubstitutionsToTeam(
    team: TeamEntity,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
    teamDetails: TeamMatchDetails,
  ): void {
    const squad = playersByTeam.get(team.teamId) || [];
    if (squad.length < 12) {
      return;
    }

    const starters = squad.slice(0, 11);
    const bench = squad.slice(11);
    if (!starters.length || !bench.length) {
      return;
    }

    let substitutionCount = this.randomInt(1, 3);
    if (teamDetails.injuriesDetails.length > substitutionCount) {
      substitutionCount = teamDetails.injuriesDetails.length;
    }
    if (Math.random() < 0.25) {
      substitutionCount += 1;
    }
    substitutionCount = Math.min(5, substitutionCount, starters.length, bench.length);

    const usedOut = new Set<string>();
    const usedIn = new Set<string>();

    for (let index = 0; index < substitutionCount; index += 1) {
      const outPool = starters.filter((player) => !usedOut.has(player.playerId));
      const inPool = bench.filter((player) => !usedIn.has(player.playerId));
      if (!outPool.length || !inPool.length) {
        break;
      }

      const playerOut = outPool[this.randomInt(0, outPool.length - 1)];
      const playerIn = inPool[this.randomInt(0, inPool.length - 1)];
      usedOut.add(playerOut.playerId);
      usedIn.add(playerIn.playerId);

      teamDetails.substitutionsDetails.push({
        playerInName: playerIn.name,
        playerOutName: playerOut.name,
        minute: this.randomInt(46, 89),
      });
    }
  }

  private createEmptyTeamMatchDetails(): TeamMatchDetails {
    return {
      totalYellowCards: 0,
      totalRedCards: 0,
      goalsDetails: [],
      cardsDetails: [],
      injuriesDetails: [],
      substitutionsDetails: [],
    };
  }

  private sortTeamMatchDetails(details: TeamMatchDetails): void {
    details.goalsDetails.sort((a, b) => a.minute - b.minute);
    details.cardsDetails.sort((a, b) => a.minute - b.minute);
    details.injuriesDetails.sort((a, b) => a.minute - b.minute);
    details.substitutionsDetails.sort((a, b) => a.minute - b.minute);
  }

  /**
   * Accumulates per-match contribution for POTM scoring.
   */
  private bumpContribution(
    contributions: Map<string, MatchPlayerContribution>,
    team: TeamEntity,
    player: TeamPlayerEntity,
    delta: { goals?: number; assists?: number; cleanSheets?: number },
  ): void {
    const key = `${team.teamId}:${player.playerId}`;
    const current = contributions.get(key);

    if (current) {
      current.goals += delta.goals || 0;
      current.assists += delta.assists || 0;
      current.cleanSheets += delta.cleanSheets || 0;
      return;
    }

    contributions.set(key, {
      team,
      player,
      goals: delta.goals || 0,
      assists: delta.assists || 0,
      cleanSheets: delta.cleanSheets || 0,
    });
  }

  /**
   * Picks one Player of the Match using in-game contributions.
   * Fallback: random outfield player from winner team (or both teams if draw).
   */
  private pickPlayerOfMatch(
    contributions: Map<string, MatchPlayerContribution>,
    winnerTeamId: string | null,
    homeTeam: TeamEntity,
    awayTeam: TeamEntity,
    playersByTeam: Map<string, TeamPlayerEntity[]>,
  ): { team: TeamEntity; player: TeamPlayerEntity } | null {
    const ranked = Array.from(contributions.values()).sort((a, b) => {
      const scoreA = a.goals * 5 + a.assists * 3 + a.cleanSheets * 4;
      const scoreB = b.goals * 5 + b.assists * 3 + b.cleanSheets * 4;
      return scoreB - scoreA || b.goals - a.goals || b.assists - a.assists || b.cleanSheets - a.cleanSheets;
    });

    if (ranked[0]) {
      return { team: ranked[0].team, player: ranked[0].player };
    }

    const pickFromTeam = (team: TeamEntity): TeamPlayerEntity | null => {
      const squad = playersByTeam.get(team.teamId) || [];
      const outfield = squad.filter((player) => player.position !== 'GK');
      const pool = outfield.length ? outfield : squad;
      if (!pool.length) {
        return null;
      }
      return pool[this.randomInt(0, pool.length - 1)];
    };

    if (winnerTeamId) {
      const winnerTeam = winnerTeamId === homeTeam.teamId ? homeTeam : awayTeam;
      const winnerPick = pickFromTeam(winnerTeam);
      if (winnerPick) {
        return { team: winnerTeam, player: winnerPick };
      }
    }

    const homePick = pickFromTeam(homeTeam);
    if (homePick) {
      return { team: homeTeam, player: homePick };
    }

    const awayPick = pickFromTeam(awayTeam);
    if (awayPick) {
      return { team: awayTeam, player: awayPick };
    }

    return null;
  }

  private getOrCreatePlayerTally(
    worldCupId: string,
    team: TeamEntity,
    player: TeamPlayerEntity,
    tallyMap: Map<string, PlayerTally>,
  ): PlayerTally {
    const key = `${worldCupId}:${team.teamId}:${player.playerId}`;
    const existing = tallyMap.get(key);
    if (existing) {
      return existing;
    }

    const created: PlayerTally = {
      worldCupId,
      teamId: team.teamId,
      teamName: team.name,
      playerId: player.playerId,
      playerName: player.name,
      position: player.position,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
      playerOfMatch: 0,
    };

    tallyMap.set(key, created);
    return created;
  }

  private toPlayerStatModel(entity: WorldCupPlayerStatEntity, value: number): WorldCupPlayerStat {
    return {
      playerName: entity.playerName,
      teamId: entity.teamId,
      teamName: entity.teamName,
      value,
    };
  }

  private toWorldCupModel(entity: WorldCupEntity): WorldCup {
    return {
      worldCupId: entity.worldCupId,
      edition: entity.edition,
      status: entity.status,
      hasActiveFinal: entity.status === WorldCupStatus.FINAL_ACTIVE,
      canResimulate: entity.status === WorldCupStatus.READY_FOR_FINAL,
      canStartFinal: entity.status === WorldCupStatus.READY_FOR_FINAL,
      selectedTeamId: entity.selectedTeamId,
      selectedTeamName: entity.selectedTeamName,
      finalHomeTeamId: entity.finalHomeTeamId,
      finalHomeTeamName: entity.finalHomeTeamName,
      finalAwayTeamId: entity.finalAwayTeamId,
      finalAwayTeamName: entity.finalAwayTeamName,
      finalMatchId: entity.finalMatchId,
      createdAt: entity.creationDate,
      updatedAt: entity.lastUpdate,
    };
  }

  private toWorldCupMatchModel(entity: WorldCupMatchEntity): WorldCupMatch {
    return {
      stage: entity.stage as WorldCupStage,
      groupName: entity.groupName,
      matchCode: entity.matchCode,
      homeTeamId: entity.homeTeamId,
      homeTeamName: entity.homeTeamName,
      awayTeamId: entity.awayTeamId,
      awayTeamName: entity.awayTeamName,
      homeGoals: entity.homeGoals,
      awayGoals: entity.awayGoals,
      homePenaltyGoals: entity.homePenaltyGoals,
      awayPenaltyGoals: entity.awayPenaltyGoals,
      winnerTeamId: entity.winnerTeamId,
      winnerTeamName: entity.winnerTeamName,
      resolution: entity.resolution as WorldCupMatchResolution,
      isPending: entity.isPending,
      playerOfMatch: entity.playerOfMatchName
        ? {
            playerName: entity.playerOfMatchName,
            teamId: entity.playerOfMatchTeamId || entity.winnerTeamId || '',
            teamName: entity.playerOfMatchTeamName || entity.winnerTeamName || '',
          }
        : null,
      homeTeamTotalYellowCards: entity.homeTotalYellowCards || 0,
      homeTeamTotalRedCards: entity.homeTotalRedCards || 0,
      awayTeamTotalYellowCards: entity.awayTotalYellowCards || 0,
      awayTeamTotalRedCards: entity.awayTotalRedCards || 0,
      homeTeamGoalsDetails: this.parseMatchDetailJson(entity.homeGoalsDetailsJson),
      awayTeamGoalsDetails: this.parseMatchDetailJson(entity.awayGoalsDetailsJson),
      homeTeamCardsDetails: this.parseMatchDetailJson(entity.homeCardsDetailsJson),
      awayTeamCardsDetails: this.parseMatchDetailJson(entity.awayCardsDetailsJson),
      homeTeamInjuriesDetails: this.parseMatchDetailJson(entity.homeInjuriesDetailsJson),
      awayTeamInjuriesDetails: this.parseMatchDetailJson(entity.awayInjuriesDetailsJson),
      homeTeamSubstitutionsDetails: this.parseMatchDetailJson(entity.homeSubstitutionsDetailsJson),
      awayTeamSubstitutionsDetails: this.parseMatchDetailJson(entity.awaySubstitutionsDetailsJson),
    };
  }

  private async findCurrentWorldCup(): Promise<WorldCupEntity | null> {
    return this.worldCupRepository.findOne({
      where: { isCurrent: true },
      order: { creationDate: 'DESC' },
    });
  }

  private async getWorldCupEntityById(worldCupId: string): Promise<WorldCupEntity> {
    const worldCup = await this.worldCupRepository.findOne({ where: { worldCupId: worldCupId.trim() } });
    if (!worldCup) {
      throw new NotFoundException(ApiErrorCode.WORLD_CUP_NOT_FOUND);
    }

    return worldCup;
  }

  private async getTeamById(teamId: string): Promise<TeamEntity> {
    const team = await this.teamRepository.findOne({ where: { teamId: teamId.trim().toLowerCase() } });
    if (!team) {
      throw new NotFoundException(ApiErrorCode.TEAM_NOT_FOUND);
    }
    return team;
  }

  private async clearSimulationData(worldCupId: string): Promise<void> {
    await this.worldCupGroupStandingRepository.delete({ worldCupId });
    await this.worldCupMatchRepository.delete({ worldCupId });
    await this.worldCupPlayerStatRepository.delete({ worldCupId });
  }

  private parseStageFilter(stage?: string): WorldCupStage | null {
    const normalized = stage?.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    if (!Object.values(WorldCupStage).includes(normalized as WorldCupStage)) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    return normalized as WorldCupStage;
  }

  private parseMatchDetailJson<T>(value: string | null | undefined): T[] {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private parseSubstitutionDetailFromEvent(
    event: MatchStatEntity,
  ): Omit<MatchSubstitutionDetail, 'minute'> | null {
    if (!event) {
      return null;
    }

    if (
      event.messageKey === 'match.timeline.substitution' ||
      event.messageKey === 'match.timeline.substitution.entersField'
    ) {
      const params = this.parseMessageParamsJson(event.messageParamsJson);
      const playerInName = this.asStringParam(params?.incomingPlayerName);
      const playerOutName = this.asStringParam(params?.outgoingPlayerName);
      if (playerInName && playerOutName) {
        return {
          playerInName,
          playerOutName,
        };
      }
    }

    const message = event.message;
    if (!message) {
      return null;
    }

    const trimmed = message.trim();
    const spanishIn = trimmed.match(/ingresa\s+(.+?)\s+por\s+(.+?)[\.\!]?\s*$/i);
    if (spanishIn) {
      return {
        playerInName: spanishIn[1].trim(),
        playerOutName: spanishIn[2].trim(),
      };
    }

    const spanishReplace = trimmed.match(/(.+?)\s+reemplaza\s+a\s+(.+?)[\.\!]?\s*$/i);
    if (spanishReplace) {
      return {
        playerInName: spanishReplace[1].trim(),
        playerOutName: spanishReplace[2].trim(),
      };
    }

    const englishReplace = trimmed.match(/(.+?)\s+replaces\s+(.+?)[\.\!]?\s*$/i);
    if (englishReplace) {
      return {
        playerInName: englishReplace[1].trim(),
        playerOutName: englishReplace[2].trim(),
      };
    }

    return null;
  }

  private eventLooksLikeInjury(event: MatchStatEntity): boolean {
    if (event.messageKey === 'match.timeline.injury' || event.messageKey === 'match.timeline.lowEnergyInjury') {
      return true;
    }

    const message = event.message;
    if (!message) {
      return false;
    }

    const normalized = message.trim().toLowerCase();
    return (
      normalized.includes('injur') ||
      normalized.includes('lesion') ||
      normalized.includes('lesionado')
    );
  }

  private parseMessageParamsJson(
    raw: string | null | undefined,
  ): Record<string, unknown> | null {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }

      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private asStringParam(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private resolveLocale(lang?: string): AppLocale {
    return lang?.trim().toLowerCase() === 'es' ? 'es' : 'en';
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Reads world cup edition from env.
   * Defaults to 2026 when unset/invalid.
   */
  private loadWorldCupEdition(): number {
    const raw = this.configService.get<string>('WORLD_CUP_EDITION', '2026');
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 3000) {
      return 2026;
    }

    return parsed;
  }

  private shuffle<T>(input: T[]): T[] {
    const copy = [...input];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = this.randomInt(0, index);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }
}
