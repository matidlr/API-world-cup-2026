import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { LiveEventsController } from './controllers/live-events.controller';
import { PlayFinalController } from './controllers/play-final.controller';
import { TeamStateController } from './controllers/team-state.controller';
import { LiveEventsService } from './services/live-events.service';
import { PlayFinalService } from './services/play-final.service';
import { TeamStateService } from './services/team-state.service';

@Module({
  imports: [AdminModule],
  controllers: [TeamStateController, LiveEventsController, PlayFinalController],
  providers: [TeamStateService, LiveEventsService, PlayFinalService],
})
export class MatchModule {}
