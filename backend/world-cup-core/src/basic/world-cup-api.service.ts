import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WorldCupApiService {
  /** Provides low-level HTTP GET/POST helpers against the World Cup API base url. */
  private readonly baseUrl: string;
  private readonly basePath: string;

  /** Reads base url and base path from environment configuration. */
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('WORLD_CUP_API_URL', 'http://localhost:5101');
    this.basePath = this.configService.get<string>('WORLD_CUP_API_BASE_PATH', '/worldCup');
  }

  /** Executes a GET request to a World Cup API endpoint path. */
  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.get<T>(this.buildUrl(path), {
        params,
        headers: {
          Accept: 'application/json',
        },
      }),
    );

    return response.data;
  }

  /** Executes a POST request to a World Cup API endpoint path. */
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.post<T>(this.buildUrl(path), body ?? {}, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );

    return response.data;
  }

  /** Builds a full url from configured base path and endpoint path. */
  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedBasePath = this.basePath.startsWith('/') ? this.basePath : `/${this.basePath}`;
    return `${this.baseUrl}${normalizedBasePath}${normalizedPath}`;
  }
}
