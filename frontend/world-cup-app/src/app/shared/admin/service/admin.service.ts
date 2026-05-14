import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { Team } from '../../../core/models/team.interface';
import { AdminConfigData, AppLang } from '../model/admin-api.interface';

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseApiService {
  private readonly currentTeamSubject = new BehaviorSubject<Team | null>(null);

  readonly currentTeam$ = this.currentTeamSubject.asObservable();
  readonly currentTeamId$ = this.appContextService.currentTeamId$;
  readonly lang$ = this.appContextService.lang$;

  initializeContext(): Observable<void> {
    return this.get<AdminConfigData>('/admin/config').pipe(
      map((res) => res?.data),
      tap((config) => {
        const normalizedTeamId = this.normalizeTeamId(config?.teamId);
        const normalizedLang = this.normalizeLang(config?.lang);

        this.appContextService.applyBackendContext(normalizedTeamId, normalizedLang);
        this.currentTeamSubject.next({
          teamId: normalizedTeamId,
          id: normalizedTeamId,
          name: normalizedTeamId.toUpperCase(),
          teamName: normalizedTeamId.toUpperCase(),
          flag: '⚽',
        } as Team);
      }),
      map(() => undefined),
    );
  }

  getCurrentTeam(): Team | null {
    return this.currentTeamSubject.value;
  }

  private normalizeLang(lang?: string): AppLang {
    return lang?.toLowerCase() === 'en' ? 'en' : 'es';
  }

  private normalizeTeamId(teamId?: string): string {
    const normalized = teamId?.trim().toLowerCase();
    return normalized || 'arg';
  }
}
