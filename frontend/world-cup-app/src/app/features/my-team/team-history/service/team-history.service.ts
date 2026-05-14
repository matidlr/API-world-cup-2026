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
import { AdminService } from '../../../../shared/admin/service/admin.service';
import { TeamHistoryApiResponse } from '../model/team-history-api.interface';
import { TeamHistoryViewModel } from '../model/team-history-view-model.interface';

@Injectable({ providedIn: 'root' })
export class TeamHistoryService extends BaseApiService {
  private readonly adminService = inject(AdminService);
  private readonly uiVisualsService = inject(UiVisualsService);

  private readonly pageState: TeamHistoryViewModel = {
    lang: 'es',
    loading: false,
    errorMessage: '',
    selectedTeamLabel: 'ARG',
    totalTitles: 0,
    totalCompetitions: 0,
    organizations: [],
    titles: [],
    sections: [],
  };

  private hasInitialized = false;

  getViewModel(): TeamHistoryViewModel {
    return this.pageState;
  }

  initialize(): void {
    if (this.hasInitialized) {
      this.loadHistory().subscribe();
      return;
    }

    this.hasInitialized = true;
    this.pageState.lang = this.getCurrentLang();
    this.pageState.selectedTeamLabel = this.adminService.getCurrentTeam()?.name ?? 'ARG';

    this.adminService.currentTeam$.subscribe((team) => {
      this.pageState.selectedTeamLabel = team?.name ?? 'ARG';
    });

    combineLatest([this.appContextService.currentTeamId$, this.appContextService.lang$])
      .pipe(
        tap(([, lang]) => (this.pageState.lang = lang === 'en' ? 'en' : 'es')),
        switchMap(() => this.loadHistory()),
      )
      .subscribe();
  }

  private loadHistory(): Observable<void> {
    const lang = this.getCurrentLang();
    this.pageState.lang = lang;
    this.pageState.loading = true;
    this.pageState.errorMessage = '';

    return this.get<TeamHistoryApiResponse>('/my-team/history', { lang }).pipe(
      map((response) => response.data),
      map((history) => this.normalizeHistory(history)),
      tap((history) => {
        this.pageState.totalTitles = history?.totalTitles ?? 0;
        this.pageState.totalCompetitions = history?.totalCompetitions ?? 0;
        this.pageState.organizations = history?.organizations ?? [];
        this.pageState.titles = history?.titles ?? [];
        this.pageState.sections = history?.sections ?? [];
      }),
      map(() => undefined),
      catchError(() => {
        this.pageState.totalTitles = 0;
        this.pageState.totalCompetitions = 0;
        this.pageState.organizations = [];
        this.pageState.titles = [];
        this.pageState.sections = [];
        this.pageState.errorMessage = 'No se pudo cargar la historia del equipo.';
        return of(undefined);
      }),
      finalize(() => (this.pageState.loading = false)),
    );
  }

  private normalizeHistory(history: TeamHistoryApiResponse | null | undefined): TeamHistoryApiResponse | null {
    if (!history) {
      return null;
    }

    return {
      ...history,
      sections: (history.sections ?? []).map((section) => ({
        ...section,
        icon: this.uiVisualsService.getTeamHistorySectionIcon(section.key),
      })),
    };
  }
}
