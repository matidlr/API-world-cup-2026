import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { TeamHistoryQueryRequest } from './request/team-history-query.request';
import { TeamHistoryService } from '../services/team-history.service';

@ApiTags('my-team')
@Controller('my-team')
export class TeamHistoryController extends AbstractController {
  /** Exposes team history endpoints and delegates logic to TeamHistoryService. */
  constructor(private readonly teamHistoryService: TeamHistoryService) {
    super();
  }

  /** Returns title history for the selected team. */
  @Get('history')
  @ApiOperation({ summary: 'My Team - Team history component' })
  @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'] })
  public async getHistory(@Query() request: TeamHistoryQueryRequest): Promise<unknown> {
    return this.createOkResponse(await this.teamHistoryService.getHistory(request.lang));
  }
}
