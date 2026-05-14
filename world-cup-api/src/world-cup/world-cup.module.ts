import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchSquadEntity } from 'src/match/entity/match-squad.entity';
import { MatchStatEntity } from 'src/match/entity/match-stat.entity';
import { TeamHistoryEntity } from 'src/teams/entity/team-history.entity';
import { TeamPlayerEntity } from 'src/teams/entity/team-player.entity';
import { TeamEntity } from 'src/teams/entity/team.entity';
import { WorldCupEntity } from './entity/world-cup.entity';
import { WorldCupGroupStandingEntity } from './entity/world-cup-group-standing.entity';
import { WorldCupMatchEntity } from './entity/world-cup-match.entity';
import { WorldCupPlayerStatEntity } from './entity/world-cup-player-stat.entity';
import { WorldCupController } from './world-cup.controller';
import { WorldCupService } from './world-cup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorldCupEntity,
      WorldCupGroupStandingEntity,
      WorldCupMatchEntity,
      WorldCupPlayerStatEntity,
      MatchStatEntity,
      MatchSquadEntity,
      TeamEntity,
      TeamHistoryEntity,
      TeamPlayerEntity,
    ]),
  ],
  controllers: [WorldCupController],
  providers: [WorldCupService, I18nService],
  exports: [WorldCupService],
})
export class WorldCupModule {}
