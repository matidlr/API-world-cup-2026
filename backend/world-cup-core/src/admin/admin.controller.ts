import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../basic/abstract.controller';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController extends AbstractController {
  constructor(private readonly adminService: AdminService) {
    super();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current app context (teamId + language from env)' })
  public getCurrentConfig() {
    const config = this.adminService.getCurrentConfig();

    return this.createOkResponse({
      teamId: config.teamId,
      lang: config.lang,
    });
  }
}
