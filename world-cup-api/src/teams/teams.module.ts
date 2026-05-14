import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachEntity } from './entity/coach.entity';
import { TeamHistoryEntity } from './entity/team-history.entity';
import { TeamPlayerEntity } from './entity/team-player.entity';
import { TeamRivalEntity } from './entity/team-rival.entity';
import { TeamStatsEntity } from './entity/team-stats.entity';
import { TeamTacticsDefaultEntity } from './entity/team-tactics-default.entity';
import { TeamEntity } from './entity/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoachEntity,
      TeamEntity,
      TeamStatsEntity,
      TeamPlayerEntity,
      TeamHistoryEntity,
      TeamRivalEntity,
      TeamTacticsDefaultEntity,
    ]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
