import { Component, OnInit } from '@angular/core';
import { SimulateService } from './service/simulate.service';
import { SimulationApiResponse } from './model/simulate-api.interface';
import { SimulateViewModel } from './model/simulate-view-model.interface';

@Component({
  selector: 'app-simulate-page',
  standalone: false,
  templateUrl: './simulate.component.html',
  styleUrls: ['./simulate.component.css'],
})
export class SimulatePageComponent implements OnInit {
  constructor(private readonly pageService: SimulateService) {}

  get pageState(): SimulateViewModel {
    return this.pageService.getViewModel();
  }

  ngOnInit(): void {
    this.pageService.initialize();
  }

  onSimulate(): void {
    this.pageService.runSimulation();
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = (status ?? '').trim().toUpperCase();

    switch (normalizedStatus) {
      case 'READY_FOR_FINAL':
        return 'Lista para la final';
      case 'FINAL_ACTIVE':
        return 'Final en juego';
      case 'ENDED':
        return 'Final finalizada';
      default:
        return normalizedStatus || '-';
    }
  }

  getFinalBadgeLabel(simulation: SimulationApiResponse): string {
    const normalizedStatus = (simulation.status ?? '').trim().toUpperCase();

    switch (normalizedStatus) {
      case 'ENDED':
        return 'Finalizada';
      case 'FINAL_ACTIVE':
        return 'En juego';
      default:
        return 'Pendiente';
    }
  }

  getFinalCardTitle(edition: number): string {
    return `Final del Mundial ${edition}`;
  }

  getCoachLine(coach: string, formation: string, strategy: string): string {
    return `🧑‍💼 ${coach} · ${formation} · ${strategy}`;
  }
}
