import { SquadPlayer } from './squad-player.interface';
import { SquadAverageAgeScopeEnum } from './squad-average-age-scope.enum';
import { SquadPositionFilterEnum } from './squad-position-filter.enum';

export interface SquadPositionLegendItem {
  code: string;
  label: string;
  description: string;
}

export interface SquadPlayersApiResponse {
  players: SquadPlayer[];
  filteredPlayers: SquadPlayer[];
  totalPlayers: number;
  visiblePlayers: number;
  averageAge: number;
  averageAgeScope: SquadAverageAgeScopeEnum;
  positionLegend: SquadPositionLegendItem[];
  appliedFilters: {
    searchTerm: string;
    positionFilter: SquadPositionFilterEnum;
  };
}
