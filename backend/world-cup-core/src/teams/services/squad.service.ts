import { Injectable } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';
import { AbstractBaseService } from '../../basic/abstract-base.service';
import { normalizeSearchTerm } from '../../basic/helpers/normalize.helper';
import { WorldCupFeatureApiService } from '../../basic/world-cup-feature-api.service';
import { SquadAverageAgeScopeEnum } from './model/squad-average-age-scope.enum';
import { SquadPositionFilterEnum } from './model/squad-service.enum';
import {
  DictionaryPositionApiItem,
  GameDictionaryApiResponse,
  SquadPlayerApiItem,
} from './model/squad-service.interface';
import {
  SquadAppliedFiltersModel,
  SquadPlayersModel,
  SquadPositionLegendModel,
} from './model/squad-service.model';

@Injectable()
export class SquadService extends AbstractBaseService {
  /** Handles the "Squad" business flow for My Team section. */
  constructor(
    private readonly worldCupFeatureApiService: WorldCupFeatureApiService,
    adminService: AdminService,
  ) {
    super(adminService);
  }

  /** Returns player list and filter-ready payload for the currently selected team. */
  public async getPlayers(
    lang?: string,
    searchTerm?: string,
    position?: string,
  ): Promise<SquadPlayersModel> {
    const teamId = this.getCurrentTeamId();
    const playersResponse = await this.worldCupFeatureApiService.getTeamPlayers(teamId, lang);
    const dictionaryResponse = await this.worldCupFeatureApiService.getGameDictionary(lang);
    const players = this.mapAndSortPlayers(playersResponse as SquadPlayerApiItem[]);
    const positionLegend = this.buildPositionLegend(dictionaryResponse);
    const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
    const normalizedPositionFilter = this.parsePositionFilter(position);
    const filteredPlayers = this.filterPlayers(players, normalizedSearchTerm, normalizedPositionFilter);
    const averageAge = this.calculateSquadAge(players, normalizedPositionFilter);
    const averageAgeScope = this.getAverageAgeScope(normalizedPositionFilter);

    return new SquadPlayersModel({
      players,
      filteredPlayers,
      totalPlayers: players.length,
      visiblePlayers: filteredPlayers.length,
      averageAge,
      averageAgeScope,
      positionLegend,
      appliedFilters: new SquadAppliedFiltersModel({
        searchTerm: normalizedSearchTerm,
        positionFilter: normalizedPositionFilter,
      }),
    });
  }

  /** Builds a lightweight position legend (GK/DF/MF/FW) from the game dictionary endpoint. */
  private buildPositionLegend(
    dictionaryResponse: GameDictionaryApiResponse | null | undefined,
  ): SquadPositionLegendModel[] {
    const positions = Array.isArray(dictionaryResponse?.positions)
      ? dictionaryResponse.positions
      : [];

    return [SquadPositionFilterEnum.GK, SquadPositionFilterEnum.DF, SquadPositionFilterEnum.MF, SquadPositionFilterEnum.FW]
      .map((positionCode) => this.mapPositionLegendItem(positions, positionCode))
      .filter((positionLegendItem): positionLegendItem is SquadPositionLegendModel => Boolean(positionLegendItem));
  }

  /** Maps one position code into a legend item if present in dictionary payload. */
  private mapPositionLegendItem(
    positions: DictionaryPositionApiItem[],
    positionCode: SquadPositionFilterEnum,
  ): SquadPositionLegendModel | null {
    const match = positions.find(
      (positionItem) => (positionItem?.code ?? '').trim().toUpperCase() === positionCode,
    );

    if (!match) {
      return null;
    }

    return new SquadPositionLegendModel({
      code: positionCode,
      label: (match.label ?? positionCode).trim(),
      description: (match.description ?? '').trim(),
    });
  }

  /** Converts players into a predictable payload and sorts by position and shirt number. */
  private mapAndSortPlayers(players: SquadPlayerApiItem[]): SquadPlayerApiItem[] {
    const positionOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

    return (Array.isArray(players) ? players : [])
      .map((player) => ({
        ...player,
        isCaptain: Boolean(player?.isCaptain),
      }))
      .sort((leftPlayer, rightPlayer) => {
        const leftPositionPriority = positionOrder[leftPlayer.position] ?? 99;
        const rightPositionPriority = positionOrder[rightPlayer.position] ?? 99;

        if (leftPositionPriority !== rightPositionPriority) {
          return leftPositionPriority - rightPositionPriority;
        }

        return (leftPlayer.shirtNumber ?? 0) - (rightPlayer.shirtNumber ?? 0);
      });
  }

  /** Filters players by normalized search term and position filter. */
  private filterPlayers(
    players: SquadPlayerApiItem[],
    searchTerm: string,
    positionFilter: SquadPositionFilterEnum,
  ): SquadPlayerApiItem[] {
    return players.filter((player) => {
      const matchesPosition =
        positionFilter === SquadPositionFilterEnum.ALL || player.position === positionFilter;
      const matchesSearch = !searchTerm || player.name.toLowerCase().includes(searchTerm);
      return matchesPosition && matchesSearch;
    });
  }

  /** Normalizes position input and falls back to ALL when unknown. */
  private parsePositionFilter(position?: string): SquadPositionFilterEnum {
    const normalizedPosition = position?.trim().toUpperCase() ?? SquadPositionFilterEnum.ALL;
    return Object.values(SquadPositionFilterEnum).includes(normalizedPosition as SquadPositionFilterEnum)
      ? (normalizedPosition as SquadPositionFilterEnum)
      : SquadPositionFilterEnum.ALL;
  }

  /** Calculates average age for the full squad or one selected position. */
  private calculateSquadAge(
    players: SquadPlayerApiItem[],
    position?: SquadPositionFilterEnum,
  ): number {
    const normalizedPlayers = Array.isArray(players) ? players : [];
    const playersForAverage = normalizedPlayers.filter((player) =>
      this.matchesAverageScope(player, position),
    );

    if (playersForAverage.length === 0) {
      return 0;
    }

    const totalAge = playersForAverage.reduce(
      (accumulator, player) => accumulator + this.normalizeAge(player?.age),
      0,
    );
    const rawAverage = totalAge / playersForAverage.length;
    return Number(rawAverage.toFixed(1));
  }

  /** Resolves the average age scope used by frontend i18n labels. */
  private getAverageAgeScope(position: SquadPositionFilterEnum): SquadAverageAgeScopeEnum {
    switch (position) {
      case SquadPositionFilterEnum.GK:
        return SquadAverageAgeScopeEnum.GK;
      case SquadPositionFilterEnum.DF:
        return SquadAverageAgeScopeEnum.DF;
      case SquadPositionFilterEnum.MF:
        return SquadAverageAgeScopeEnum.MF;
      case SquadPositionFilterEnum.FW:
        return SquadAverageAgeScopeEnum.FW;
      default:
        return SquadAverageAgeScopeEnum.SQUAD;
    }
  }

  /** Matches players against the requested average-age scope. */
  private matchesAverageScope(
    player: SquadPlayerApiItem,
    position?: SquadPositionFilterEnum,
  ): boolean {
    if (!position || position === SquadPositionFilterEnum.ALL) {
      return true;
    }

    return (player?.position ?? '').trim().toUpperCase() === position;
  }

  /** Normalizes player ages and clamps invalid values. */
  private normalizeAge(age?: number): number {
    if (typeof age !== 'number' || !Number.isFinite(age) || age < 0) {
      return 0;
    }

    return Math.round(age);
  }
}
