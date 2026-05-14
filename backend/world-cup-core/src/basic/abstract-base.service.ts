import { AdminService } from '../admin/admin.service';
import { normalizeLanguage } from './helpers/normalize.helper';
import { LanguageEnum } from './model/language.enum';
import { WorldCupApiService } from './world-cup-api.service';

interface WorldCupResponse<T> {
  data: T;
}

export abstract class AbstractBaseService {
  /** Provides common helpers for World Cup feature services that call World Cup API endpoints. */
  protected constructor(
    protected readonly adminService: AdminService,
    protected readonly worldCupApiService?: WorldCupApiService,
  ) {}

  /** Returns the currently selected team id from admin runtime state. */
  protected getCurrentTeamId(): string {
    return this.adminService.getCurrentTeamId();
  }

  /** Returns the currently selected language from admin runtime state. */
  protected getCurrentLang(): LanguageEnum {
    return this.adminService.getCurrentLang();
  }

  /** Performs a GET call to a World Cup API endpoint and returns only the payload data. */
  protected async getEndpointData<T = unknown>(
    path: string,
    params?: Record<string, string | undefined>,
  ): Promise<T> {
    if (!this.worldCupApiService) {
      throw new Error('WorldCupApiService is required for endpoint calls.');
    }

    const response = await this.worldCupApiService.get<WorldCupResponse<T>>(
      path,
      this.sanitizeParams(params),
    );
    return response.data;
  }

  /** Performs a POST call to a World Cup API endpoint and returns only the payload data. */
  protected async postEndpointData<T = unknown>(path: string, body?: unknown): Promise<T> {
    if (!this.worldCupApiService) {
      throw new Error('WorldCupApiService is required for endpoint calls.');
    }

    const response = await this.worldCupApiService.post<WorldCupResponse<T>>(path, body ?? {});
    return response.data;
  }

  /** Removes undefined query params before issuing HTTP requests. */
  private sanitizeParams(params?: Record<string, string | undefined>): Record<string, string> {
    const sanitizedEntries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined);
    return Object.fromEntries(sanitizedEntries) as Record<string, string>;
  }

  /** Normalizes language values and falls back to the selected admin language. */
  protected resolveLang(lang?: string): LanguageEnum {
    return normalizeLanguage(lang, this.getCurrentLang());
  }
}
