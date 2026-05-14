import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
/**
 * Exposes operational health endpoints.
 */
export class HealthController extends AbstractController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Health check for World Cup API',
    description: 'Returns a simple liveness status and process uptime in seconds.',
  })
  /**
   * Returns API liveness information.
   */
  async getHealth(): Promise<ResponseObject<{ status: string; uptimeSeconds: number }>> {
    const healthResult = await this.healthService.checkHealth();
    return this.createOkResponse(healthResult);
  }
}
