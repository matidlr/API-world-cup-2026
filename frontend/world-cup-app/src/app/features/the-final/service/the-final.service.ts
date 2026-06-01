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
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { AdminService } from 'src/app/shared/admin/service/admin.service';
import { TheFinalViewModel } from '../model/the-final-view-model.interface';
import { TheFinalApiResponse } from '../model/the-final-api.interface';

@Injectable({ providedIn: 'root' })
export class TheFinalService extends BaseApiService{
    private readonly adminService = inject(AdminService);

    private readonly theFinalState: TheFinalViewModel = {
      lang:             'es',
      loading:          false,
      errorMessage:     '',
      showNoFinalState: false,   
      showWorldCupNotReady: false, 
      data:    null,
    }

    private hasInitialized = false;
    
      getViewModel(): TheFinalViewModel {
        return this.theFinalState;
      }

    initialize(): void {
        if (this.hasInitialized) {
            this.loadFinal().subscribe();
            return;
  }

        this.hasInitialized = true;

        combineLatest([this.appContextService.currentTeamId$, this.appContextService.lang$])
            .pipe(
            tap(([, lang]) => (this.theFinalState.lang = lang === 'en' ? 'en' : 'es')),
            switchMap(() => this.loadFinal()),
            )
            .subscribe();
}
    
    private loadFinal(): Observable<void>{
        const lang = this.getCurrentLang();
        this.theFinalState.lang = lang;
        this.theFinalState.loading = true;
        this.theFinalState.errorMessage = '';

        return this.get<TheFinalApiResponse>('/final-match/current', { lang }).pipe(
  map((response) => response.data),
  tap((data) => {
    this.theFinalState.data = data;
  }),
  map(() => undefined),           // ← convierte a Observable<void>
  catchError((err) => {          
    const code = err?.error?.responseMessage?.messageCode ?? '';
    if (code === 'WC_PLAY_FINAL_UNAVAILABLE') {
      this.theFinalState.showNoFinalState = true;
    } else {
      this.theFinalState.errorMessage = 'No se pudo cargar la final.';
    }
    this.theFinalState.data = null;
    return of(undefined);
  }),
  finalize(() => (this.theFinalState.loading = false)), 
);   
}}