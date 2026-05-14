import { Module } from '@nestjs/common';
import { BasicModule } from '../basic/basic.module';
import { WorldCupFeatureApiService } from '../basic/world-cup-feature-api.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [BasicModule],
  controllers: [AdminController],
  providers: [AdminService, WorldCupFeatureApiService],
  exports: [AdminService, WorldCupFeatureApiService],
})
export class AdminModule {}
