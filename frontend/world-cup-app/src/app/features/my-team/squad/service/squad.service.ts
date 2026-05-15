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
import { AdminService } from '../../../../shared/admin/service/admin.service';
import { SquadAverageAgeScopeEnum } from '../model/squad-average-age-scope.enum';
import { SquadPlayersApiResponse } from '../model/squad-api.interface';
import { SquadPositionFilterEnum } from '../model/squad-position-filter.enum';
import { SquadViewModel } from '../model/squad-view-model.interface';

@Injectable({ providedIn: 'root' })
export class SquadService extends BaseApiService {
  private readonly adminService = inject(AdminService);

  private readonly pageState: SquadViewModel = {
    players: [],
    filteredPlayers: [],
    averageAge: 0,
    averageAgeScope: SquadAverageAgeScopeEnum.SQUAD,
    loading: false,
    errorMessage: '',
    searchTerm: '',
    positionFilter: SquadPositionFilterEnum.ALL,
    lang: 'es',
    selectedTeamLabel: 'ARG',
    positionLegend: [],
  };

  private hasInitialized = false;

  getViewModel(): SquadViewModel {
    return this.pageState;
  }

  initialize(): void {
    if (this.hasInitialized) {
      this.loadPlayers(this.pageState.searchTerm, this.pageState.positionFilter).subscribe();
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
        switchMap(() => this.loadPlayers(this.pageState.searchTerm, this.pageState.positionFilter)),
      )
      .subscribe();
  }

  setSearchTerm(searchTerm: string): void {
    this.pageState.searchTerm = searchTerm ?? '';
    this.loadPlayers(this.pageState.searchTerm, this.pageState.positionFilter).subscribe();
  }

  setPositionFilter(positionFilter: SquadPositionFilterEnum): void {
    const allowedFilters = Object.values(SquadPositionFilterEnum);
    this.pageState.positionFilter = allowedFilters.includes(positionFilter)
      ? positionFilter
      : SquadPositionFilterEnum.ALL;
    this.loadPlayers(this.pageState.searchTerm, this.pageState.positionFilter).subscribe();
  }

  private loadPlayers(searchTerm: string, positionFilter: SquadPositionFilterEnum): Observable<void> {
    const lang = this.getCurrentLang();
    this.pageState.lang = lang;
    this.pageState.loading = true;
    this.pageState.errorMessage = '';

    return this.get<SquadPlayersApiResponse>('/my-team/players', {
      lang,
      searchTerm,
      position: positionFilter,
    }).pipe(
      map((response) => response.data),
      tap((payload) => {
        this.pageState.players = payload?.players ?? [];
        this.pageState.filteredPlayers = payload?.filteredPlayers ?? [];
        this.pageState.positionLegend = payload?.positionLegend ?? [];
        this.pageState.averageAge = this.normalizeAverageAge(payload?.averageAge);
        this.pageState.averageAgeScope = this.normalizeAverageAgeScope(payload?.averageAgeScope);
      }),
      map(() => undefined),
      catchError(() => {
        this.pageState.players = [];
        this.pageState.filteredPlayers = [];
        this.pageState.positionLegend = [];
        this.pageState.averageAge = 0;
        this.pageState.averageAgeScope = SquadAverageAgeScopeEnum.SQUAD;
        this.pageState.errorMessage = 'No se pudo cargar el plantel. Intenta nuevamente.';
        return of(undefined);
      }),
      finalize(() => (this.pageState.loading = false)),
    );
  }

  private normalizeAverageAge(averageAge?: number): number {
    if (typeof averageAge !== 'number' || !Number.isFinite(averageAge) || averageAge < 0) {
      return 0;
    }

    return Number(averageAge.toFixed(1));
  }

  private normalizeAverageAgeScope(scope?: string): SquadAverageAgeScopeEnum {
    const normalizedScope = (scope ?? '').trim().toUpperCase();

    if (Object.values(SquadAverageAgeScopeEnum).includes(normalizedScope as SquadAverageAgeScopeEnum)) {
      return normalizedScope as SquadAverageAgeScopeEnum;
    }

    return SquadAverageAgeScopeEnum.SQUAD;
  }
}
