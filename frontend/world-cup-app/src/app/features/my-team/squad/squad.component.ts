import { Component, OnInit } from '@angular/core';
import { SquadAverageAgeScopeEnum } from './model/squad-average-age-scope.enum';
import { SquadService } from './service/squad.service';
import { SquadPositionFilter } from './model/squad-position-filter.type';
import { SquadViewModel } from './model/squad-view-model.interface';

@Component({
  selector: 'app-squad-page',
  standalone: false,
  templateUrl: './squad.component.html',
  styleUrls: ['./squad.component.css'],
})
export class SquadPageComponent implements OnInit {
  constructor(private readonly squadService: SquadService) {}

  get pageState(): SquadViewModel {
    return this.squadService.getViewModel();
  }

  ngOnInit(): void {
    this.squadService.initialize();
  }

  onSearchTermChange(searchTerm: string): void {
    this.squadService.setSearchTerm(searchTerm);
  }

  onPositionFilterChange(positionFilter: SquadPositionFilter): void {
    this.squadService.setPositionFilter(positionFilter);
  }

  getVisiblePlayersText(visible: number, total: number): string {
    return `${visible} jugadores visibles de un total de ${total}.`;
  }

  getAverageAgeText(scope: SquadAverageAgeScopeEnum, age: number): string {
    switch (scope) {
      case SquadAverageAgeScopeEnum.GK:
        return `Edad promedio de los GK: ${age}`;
      case SquadAverageAgeScopeEnum.DF:
        return `Edad promedio de los DF: ${age}`;
      case SquadAverageAgeScopeEnum.MF:
        return `Edad promedio de los MF: ${age}`;
      case SquadAverageAgeScopeEnum.FW:
        return `Edad promedio de los FW: ${age}`;
      default:
        return `Edad promedio del plantel: ${age}`;
    }
  }
}
