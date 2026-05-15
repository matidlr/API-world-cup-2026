import { SquadPlayer } from './squad-player.interface';
import { SquadAverageAgeScopeEnum } from './squad-average-age-scope.enum';
import { SquadPositionFilterEnum } from './squad-position-filter.enum';
import { SquadPositionLegendItem } from './squad-api.interface';

export interface SquadViewModel {
  players: SquadPlayer[];
  filteredPlayers: SquadPlayer[];
  averageAge: number;
  averageAgeScope: SquadAverageAgeScopeEnum;
  loading: boolean;
  errorMessage: string;
  searchTerm: string;
  positionFilter: SquadPositionFilterEnum;
  lang: 'es' | 'en';
  selectedTeamLabel: string;
  positionLegend: SquadPositionLegendItem[];
}
