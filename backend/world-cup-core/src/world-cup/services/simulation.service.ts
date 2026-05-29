import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';
import { AbstractBaseService } from '../../basic/abstract-base.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { normalizeNonNegativeNumber } from '../../basic/helpers/normalize.helper';
import { LanguageEnum } from '../../basic/model/language.enum';
import { WorldCupCoreErrorCode } from '../../basic/model/world-cup-core-error-code.enum';
import { WorldCupFeatureApiService } from '../../basic/world-cup-feature-api.service';
import {
  CurrentWorldCupApiResponse,
  FinalistPreview,
  SimulationScreenResponse,
  TeamCatalogApiItem,
  TeamStatsApiResponse,
} from './model/simulation-service.interface';

const SIMULATION_UNAVAILABLE_MESSAGE =
  'World Cup simulation is not available yet. Run simulation first.';

const SIMULATION_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_SIMULATION_UNAVAILABLE,
    message: SIMULATION_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_SIMULATION_UNAVAILABLE,
    message: SIMULATION_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
};

const SIMULATION_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_SIMULATION_FETCH_FAILED,
  message: 'Unable to load simulation data from World Cup API.',
  statusCode: HttpStatus.BAD_GATEWAY,
};

@Injectable()
export class SimulationService extends AbstractBaseService {
  /** Handles world cup lifecycle actions like load current state and simulate tournament. */
  constructor(
    private readonly worldCupFeatureApiService: WorldCupFeatureApiService,
    adminService: AdminService,
  ) {
    super(adminService);
  }

  /** Returns current world cup metadata for the active simulation context. */
  public async getCurrentWorldCup(lang?: string): Promise<SimulationScreenResponse> {
    const resolvedLang = this.resolveLang(lang);

    try {
      const worldCup: CurrentWorldCupApiResponse = await this.worldCupFeatureApiService.getCurrentWorldCup(
        resolvedLang,
      );

      if (!this.hasFinalists(worldCup)) {
        throw this.createSimulationUnavailableException();
      }

      return this.buildSimulationScreen(worldCup, resolvedLang);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      ErrorUtils.mapWorldCupApiError(
        error,
        SIMULATION_API_ERROR_STATUS_MAP,
        SIMULATION_API_ERROR_FALLBACK,
      );
    }
  }

  /** Simulates a new world cup using the selected team as the user team. */
  public async simulate(): Promise<SimulationScreenResponse> {
    try {
      const teamId = this.getCurrentTeamId();
      const lang = this.resolveLang();
      const worldCup: CurrentWorldCupApiResponse = await this.worldCupFeatureApiService.simulateWorldCup(
        teamId,
        lang,
      );

      if (!this.hasFinalists(worldCup)) {
        throw this.createSimulationUnavailableException();
      }

      return this.buildSimulationScreen(worldCup, lang);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      ErrorUtils.mapWorldCupApiError(
        error,
        SIMULATION_API_ERROR_STATUS_MAP,
        SIMULATION_API_ERROR_FALLBACK,
      );
    }
  }

  /** Builds the simulation payload required by the front-end screen. */
  private async buildSimulationScreen(
    worldCup: CurrentWorldCupApiResponse,
    lang: LanguageEnum,
  ): Promise<SimulationScreenResponse> {
    const worldCupStatus = (worldCup.status ?? 'READY_FOR_FINAL').trim().toUpperCase();
    const selectedTeamId = this.getCurrentTeamId();
    const selectedTeamName = (worldCup.selectedTeamName ?? selectedTeamId.toUpperCase()).trim();

    const homeTeam = await this.buildFinalistPreview(
      worldCup.finalHomeTeamId ?? '',
      worldCup.finalHomeTeamName ?? 'Home Team',
      lang,
    );
    const awayTeam = await this.buildFinalistPreview(
      worldCup.finalAwayTeamId ?? '',
      worldCup.finalAwayTeamName ?? 'Away Team',
      lang,
    );

    return {
      teamId: selectedTeamId,
      worldCupId: worldCup.worldCupId ?? '',
      edition: normalizeNonNegativeNumber(worldCup.edition),
      status: worldCupStatus,
      hasActiveFinal: Boolean(worldCup.hasActiveFinal),
      canResimulate: Boolean(worldCup.canResimulate) || worldCupStatus === 'ENDED',
      canStartFinal: Boolean(worldCup.canStartFinal),
      selectedTeamId,
      selectedTeamName,
      selectedTeamInFinal:
        homeTeam.teamId === selectedTeamId || awayTeam.teamId === selectedTeamId,
      finalMatchId: worldCup.finalMatchId ?? null,
      finalHomeTeam: homeTeam,
      finalAwayTeam: awayTeam,
    };
  }

  /** Builds one finalist card by combining team stats and catalog metadata. */
  private async buildFinalistPreview(
    teamId: string,
    fallbackName: string,
    lang: LanguageEnum,
  ): Promise<FinalistPreview> {
    const normalizedTeamId = (teamId ?? '').trim().toLowerCase();

    const stats: TeamStatsApiResponse = await this.worldCupFeatureApiService.getTeamStats(
      normalizedTeamId,
      lang,
    );
    const catalog: TeamCatalogApiItem[] = await this.worldCupFeatureApiService.listTeams(
      normalizedTeamId,
    );

    const team = Array.isArray(catalog) ? (catalog[0] as TeamCatalogApiItem | undefined) : undefined;
    const strategy = (stats?.current_strategy).trim().toUpperCase();
    const formation = (stats?.current_formation).trim();

    return {
      teamId: normalizedTeamId,
      teamName: (team?.name ?? fallbackName).trim(),
      attack: normalizeNonNegativeNumber(stats?.attack),
      defense: normalizeNonNegativeNumber(stats?.defense),
      midfield: normalizeNonNegativeNumber(stats?.midfield),
      overall: normalizeNonNegativeNumber(stats?.overall),
      coachName: (team?.coach ?? 'N/A').trim(),
      formation: formation,
      strategy,
      strategyLabel: strategy.replace(/_/g, ' '),
    };

  }

  /** Checks whether current world cup payload includes both finalists. */
  private hasFinalists(worldCup: CurrentWorldCupApiResponse): boolean {
    return Boolean(
      worldCup?.finalHomeTeamId &&
      worldCup?.finalHomeTeamName &&
      worldCup?.finalAwayTeamId &&
      worldCup?.finalAwayTeamName,
    );
  }

  /** Creates a business exception consumed by frontend empty-state logic. */
  private createFinalUnavailableException(): HttpException {
    return new HttpException(
      {
        messageCode: WorldCupCoreErrorCode.WC_SIMULATION_UNAVAILABLE,
        message: SIMULATION_UNAVAILABLE_MESSAGE,
      },
      HttpStatus.CONFLICT,
    );
  }
}
