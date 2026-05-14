import { SquadPositionFilterEnum } from './squad-service.enum';
import { SquadAverageAgeScopeEnum } from './squad-average-age-scope.enum';
import { SquadPlayerApiItem } from './squad-service.interface';

export class SquadPositionLegendModel {
  public code: string;
  public label: string;
  public description: string;

  constructor(data: { code: string; label: string; description: string }) {
    this.code = data.code;
    this.label = data.label;
    this.description = data.description;
  }
}

export class SquadAppliedFiltersModel {
  public searchTerm: string;
  public positionFilter: SquadPositionFilterEnum;

  constructor(data: { searchTerm: string; positionFilter: SquadPositionFilterEnum }) {
    this.searchTerm = data.searchTerm;
    this.positionFilter = data.positionFilter;
  }
}

export class SquadPlayersModel {
  public players: SquadPlayerApiItem[];
  public filteredPlayers: SquadPlayerApiItem[];
  public totalPlayers: number;
  public visiblePlayers: number;
  public averageAge: number;
  public averageAgeScope: SquadAverageAgeScopeEnum;
  public positionLegend: SquadPositionLegendModel[];
  public appliedFilters: SquadAppliedFiltersModel;

  constructor(data: {
    players: SquadPlayerApiItem[];
    filteredPlayers: SquadPlayerApiItem[];
    totalPlayers: number;
    visiblePlayers: number;
    averageAge: number;
    averageAgeScope: SquadAverageAgeScopeEnum;
    positionLegend: SquadPositionLegendModel[];
    appliedFilters: SquadAppliedFiltersModel;
  }) {
    this.players = data.players;
    this.filteredPlayers = data.filteredPlayers;
    this.totalPlayers = data.totalPlayers;
    this.visiblePlayers = data.visiblePlayers;
    this.averageAge = data.averageAge;
    this.averageAgeScope = data.averageAgeScope;
    this.positionLegend = data.positionLegend;
    this.appliedFilters = data.appliedFilters;
  }
}
