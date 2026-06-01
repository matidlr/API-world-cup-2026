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
}

public startFinal(): void {
  // 1. activás el loading
  this.theFinalState.loading = true;
  this.theFinalState.errorMessage = '';
  this.theFinalState.showNoFinalState = false;

  // 2. POST porque el backend usa postEndpointData
  //    URL del controller: /final-match/start
  //    solo mandás lang, el teamId lo resuelve el backend
  this.post<TheFinalApiResponse>('/final-match/start', {
    lang: this.theFinalState.lang,
  }).pipe(

    // 3. desempaquetás el wrapper { success, data, serverTime }
    map(response => response.data),

    // 4. guardás la data en el estado
    //    los campos que llegan son exactamente los del return del backend:
    //    matchId, teamId, teamName, teamGoals, opponentGoals,
    //    minute, turn, zone, possession, options, messageItems...
    tap(data => {
      this.theFinalState.data = data;
    }),

    // 5. manejás errores
    catchError(err => {
      const code = err?.error?.responseMessage?.messageCode ?? '';
      if (code === 'WC_PLAY_FINAL_UNAVAILABLE') {
        this.theFinalState.showNoFinalState = true;
      } else {
        this.theFinalState.errorMessage = 'No se pudo iniciar la final.';
      }
      this.theFinalState.data = null;
      return of(undefined);
    }),

    // 6. siempre apagás el loading al terminar
    finalize(() => (this.theFinalState.loading = false)),

  ).subscribe();  // ← subscribe porque es void, no retornás el Observable
}

public playTurn(option: string): void {
  // 1. Preparamos la pantalla activando el spinner
  this.theFinalState.loading = true;
  this.theFinalState.errorMessage = '';

  // 2. Hacemos el POST al backend mandando la opción elegida y el idioma
  this.post<TheFinalApiResponse>('/final-match/play-turn', {
    option,
    lang: this.theFinalState.lang,
  })
  .pipe(
    // Nos quedamos solo con la data útil de la respuesta de la API
    map(response => response.data),

    // Usamos tap para actualizar el estado de nuestra pantalla
    tap(data => {
      // Si ya tenemos datos previos del partido, actualizamos los campos clave
      if (this.theFinalState.data) {
        this.theFinalState.data.options = data.options;
        this.theFinalState.data.messages = data.messages;

      } else {
        // Si por alguna razón 'this.theFinalState.data' era null, le asignamos la data completa
        this.theFinalState.data = data;
      }
    }),

    // Atrapamos errores para que no se rompa la aplicación si el servidor falla
    catchError((error) => {
      this.theFinalState.errorMessage = 'Hubo un problema al procesar el turno de la final.';
      // Devolvemos un observable vacío para mantener el flujo cerrado correctamente
      return of(null); 
    }),

    // Pase lo que pase (éxito o error), apagamos el spinner de carga
    finalize(() => {
      this.theFinalState.loading = false;
    })
  )
  // 3. ¡EL GATILLO! Sin el subscribe(), la petición nunca sale del navegador
  .subscribe();
}




}