import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { CoachingController } from './controllers/coaching.controller';
import { RivalsController } from './controllers/rivals.controller';
import { SquadController } from './controllers/squad.controller';
import { TeamHistoryController } from './controllers/team-history.controller';
import { CoachingService } from './services/coaching.service';
import { RivalsService } from './services/rivals.service';
import { SquadService } from './services/squad.service';
import { TeamHistoryService } from './services/team-history.service';

@Module({
  imports: [AdminModule],
  controllers: [SquadController, CoachingController, TeamHistoryController, RivalsController],
  providers: [SquadService, CoachingService, TeamHistoryService, RivalsService],
})
export class TeamsModule {}
