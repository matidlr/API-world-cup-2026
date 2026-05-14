import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';

/**
 * Backward-compatible alias.
 *
 * New services should extend BaseApiService directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiService extends BaseApiService {}
