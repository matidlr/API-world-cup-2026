import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  private readonly currentTeamIdSubject = new BehaviorSubject<string>('arg');
  private readonly langSubject = new BehaviorSubject<'es' | 'en'>('es');
  private readonly worldCupRefreshSubject = new BehaviorSubject<number>(0);
  private readonly finalMatchRefreshSubject = new BehaviorSubject<number>(0);
  private readonly startFinalRequestSubject = new Subject<void>();

  readonly currentTeamId$ = this.currentTeamIdSubject.asObservable();
  readonly lang$ = this.langSubject.asObservable();
  readonly worldCupRefresh$ = this.worldCupRefreshSubject.asObservable();
  readonly finalMatchRefresh$ = this.finalMatchRefreshSubject.asObservable();
  readonly startFinalRequest$ = this.startFinalRequestSubject.asObservable();

  getCurrentTeamId(): string {
    return this.currentTeamIdSubject.value;
  }

  getCurrentLang(): 'es' | 'en' {
    return this.langSubject.value;
  }

  applyBackendContext(teamId?: string, lang?: string): void {
    this.setCurrentTeamId(teamId);
    this.setCurrentLang(lang);
  }

  setCurrentTeamId(teamId?: string): void {
    this.currentTeamIdSubject.next(this.normalizeTeamId(teamId));
  }

  setCurrentLang(lang?: string): void {
    this.langSubject.next(this.normalizeLang(lang));
  }

  notifyWorldCupDataChanged(): void {
    this.worldCupRefreshSubject.next(this.worldCupRefreshSubject.value + 1);
  }

  notifyFinalMatchDataChanged(): void {
    this.finalMatchRefreshSubject.next(this.finalMatchRefreshSubject.value + 1);
  }

  requestStartFinal(): void {
    this.startFinalRequestSubject.next();
  }

  private normalizeTeamId(teamId?: string): string {
    const normalized = teamId?.trim().toLowerCase();
    return normalized || 'arg';
  }

  private normalizeLang(lang?: string): 'es' | 'en' {
    return lang?.toLowerCase() === 'en' ? 'en' : 'es';
  }
}
