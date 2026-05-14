import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { TeamsModule } from './teams/teams.module';
import { WorldCupModule } from './world-cup/world-cup.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env',
    }),
    AdminModule,
    TeamsModule,
    WorldCupModule,
    MatchModule,
  ],
})
export class AppModule {}
