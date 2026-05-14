import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { GroupsController } from './controllers/groups.controller';
import { JourneyController } from './controllers/journey.controller';
import { MatchesController } from './controllers/matches.controller';
import { SimulationController } from './controllers/simulation.controller';
import { StatsAwardsController } from './controllers/stats-awards.controller';
import { WorldCupHistoryController } from './controllers/world-cup-history.controller';
import { GroupsService } from './services/groups.service';
import { JourneyService } from './services/journey.service';
import { MatchesService } from './services/matches.service';
import { SimulationService } from './services/simulation.service';
import { StatsAwardsService } from './services/stats-awards.service';
import { WorldCupHistoryService } from './services/world-cup-history.service';

@Module({
  imports: [AdminModule],
  controllers: [
    SimulationController,
    GroupsController,
    JourneyController,
    MatchesController,
    StatsAwardsController,
    WorldCupHistoryController,
  ],
  providers: [
    GroupsService,
    SimulationService,
    MatchesService,
    JourneyService,
    StatsAwardsService,
    WorldCupHistoryService,
  ],
})
export class WorldCupModule {}
