import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { UiVisualsService } from '../../../../core/services/ui-visuals.service';
import { SimulationApiResponse } from '../model/simulate-api.interface';
import { SimulateViewModel } from '../model/simulate-view-model.interface';

@Injectable({ providedIn: 'root' })
export class SimulateService extends BaseApiService {
  private readonly uiVisualsService = inject(UiVisualsService);

  private readonly pageState: SimulateViewModel = {
    lang: 'es',
    loading: false,
    simulating: false,
    errorMessage: '',
    showNoSimulationState: false,
    simulation: null,
  };

  private hasInitialized = false;

  getViewModel(): SimulateViewModel {
    return this.pageState;
  }

  initialize(): void {
    if (this.hasInitialized) {
      this.loadCurrentSimulation().subscribe();
      return;
    }

    this.hasInitialized = true;
    this.pageState.lang = this.getCurrentLang();

    combineLatest([
      this.appContextService.currentTeamId$,
      this.appContextService.lang$,
      this.appContextService.worldCupRefresh$,
    ])
      .pipe(
        tap(([, lang]) => (this.pageState.lang = lang === 'en' ? 'en' : 'es')),
        switchMap(() => this.loadCurrentSimulation()),
      )
      .subscribe();
  }

  runSimulation(): void {
    if (this.pageState.simulating) {
      return;
    }

    const lang = this.getCurrentLang();
    this.pageState.lang = lang;
    this.pageState.simulating = true;
    this.pageState.errorMessage = '';

    this.post<SimulationApiResponse>('/world-cup/simulate')
      .pipe(
        map((response) => response.data),
        map((simulation) => this.normalizeSimulation(simulation)),
        tap((simulation) => (this.pageState.simulation = simulation)),
        tap(() => (this.pageState.showNoSimulationState = false)),
        tap(() => this.appContextService.notifyWorldCupDataChanged()),
        catchError((error: HttpErrorResponse) => {
          if (this.isSimulationUnavailableError(error)) {
            this.pageState.simulation = null;
            this.pageState.showNoSimulationState = true;
            this.pageState.errorMessage = '';
            return of(undefined);
          }

          this.pageState.errorMessage = 'No se pudo ejecutar la simulación del Mundial.';
          return of(undefined);
        }),
        finalize(() => (this.pageState.simulating = false)),
      )
      .subscribe();
  }

  private loadCurrentSimulation(): Observable<void> {
    const lang = this.getCurrentLang();
    this.pageState.lang = lang;
    this.pageState.loading = true;
    this.pageState.errorMessage = '';

    return this.get<SimulationApiResponse>('/world-cup/current', { lang }).pipe(
      map((response) => response.data),
      map((simulation) => this.normalizeSimulation(simulation)),
      tap((simulation) => (this.pageState.simulation = simulation)),
      tap(() => (this.pageState.showNoSimulationState = false)),
      map(() => undefined),
      catchError((error: HttpErrorResponse) => {
        if (this.isSimulationUnavailableError(error)) {
          this.pageState.simulation = null;
          this.pageState.showNoSimulationState = true;
          this.pageState.errorMessage = '';
          return of(undefined);
        }

        this.pageState.simulation = null;
        this.pageState.showNoSimulationState = false;
        this.pageState.errorMessage = 'No se pudieron cargar los datos de simulación de la final.';
        return of(undefined);
      }),
      finalize(() => (this.pageState.loading = false)),
    );
  }

  private normalizeSimulation(
    simulation: SimulationApiResponse | null | undefined,
  ): SimulationApiResponse | null {
    if (!simulation) {
      return null;
    }

    return {
      ...simulation,
      finalHomeTeam: {
        ...simulation.finalHomeTeam,
        flag: this.uiVisualsService.getTeamFlag(simulation.finalHomeTeam?.teamId),
      },
      finalAwayTeam: {
        ...simulation.finalAwayTeam,
        flag: this.uiVisualsService.getTeamFlag(simulation.finalAwayTeam?.teamId),
      },
    };
  }

  private isSimulationUnavailableError(error: HttpErrorResponse): boolean {
    const messageCode = (error?.error as { responseMessage?: { messageCode?: string } } | undefined)
      ?.responseMessage?.messageCode;

    return messageCode === 'WC_SIMULATION_UNAVAILABLE';
  }
}
