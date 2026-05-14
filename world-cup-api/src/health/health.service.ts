import { Injectable } from '@nestjs/common';

@Injectable()
/**
 * HealthService
 *
 * Responsibilities:
 * - Expose a simple API availability status.
 * - Provide a basic uptime metric for quick diagnostics.
 *
 * Notes:
 * - It has no dependency on database or external services.
 * - It is used by smoke/health checks to validate process liveness.
 */
export class HealthService {
  /**
   * Returns a lightweight liveness payload used by smoke tests and monitoring checks.
   */
  async checkHealth(): Promise<{ status: string; uptimeSeconds: number }> {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
