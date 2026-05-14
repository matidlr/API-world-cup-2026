import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseObject } from '../models/response-object.interface';
import { AppContextService } from './app-context.service';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private readonly http = inject(HttpClient);
  protected readonly appContextService = inject(AppContextService);
  protected readonly baseUrl = environment.coreServiceUrl;

  protected get<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Observable<ResponseObject<T>> {
    return this.http.get<ResponseObject<T>>(`${this.baseUrl}${path}`, {
      params: this.buildHttpParams(params),
    });
  }

  protected post<T>(path: string, body?: unknown): Observable<ResponseObject<T>> {
    return this.http.post<ResponseObject<T>>(`${this.baseUrl}${path}`, body ?? {});
  }

  getCurrentLang(): 'es' | 'en' {
    return this.appContextService.getCurrentLang();
  }

  getCurrentTeamId(): string {
    return this.appContextService.getCurrentTeamId();
  }

  private buildHttpParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
