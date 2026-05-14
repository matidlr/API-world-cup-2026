import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './basic/all-exceptions.filter';
import { DatabaseModule } from './database.module';
import { HealthModule } from './health/health.module';
import { MatchModule } from './match/match.module';
import { ReferenceModule } from './reference/reference.module';
import { TeamsModule } from './teams/teams.module';
import { WorldCupModule } from './world-cup/world-cup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env',
    }),
    DatabaseModule,
    HealthModule,
    TeamsModule,
    WorldCupModule,
    MatchModule,
    ReferenceModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
