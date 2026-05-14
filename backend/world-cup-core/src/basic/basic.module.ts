import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WorldCupApiService } from './world-cup-api.service';

@Module({
  imports: [HttpModule],
  providers: [WorldCupApiService],
  exports: [WorldCupApiService],
})
export class BasicModule {}
