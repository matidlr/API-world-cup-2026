import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { SquadQueryRequest } from './request/squad-query.request';
import { SquadService } from '../services/squad.service';

@ApiTags('my-team')
@Controller('my-team')
export class SquadController extends AbstractController {
  /** Exposes squad endpoints and delegates logic to SquadService. */
  constructor(private readonly squadService: SquadService) {
    super();
  }

  /** Returns squad data for the selected team. */
  @Get('players')
  @ApiOperation({ summary: 'My Team - Squad component' })
  @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'] })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'position', required: false, enum: ['ALL', 'GK', 'DF', 'MF', 'FW'] })
  public async getPlayers(@Query() request: SquadQueryRequest): Promise<unknown> {
    return this.createOkResponse(
      await this.squadService.getPlayers(request.lang, request.searchTerm, request.position),
    );
  }
}
