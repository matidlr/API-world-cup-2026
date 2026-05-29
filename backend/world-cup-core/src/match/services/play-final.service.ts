import { Injectable } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { WorldCupApiService } from 'src/basic/world-cup-api.service';

@Injectable()
export class PlayFinalService extends AbstractBaseService {
  constructor( worldCupApiService: WorldCupApiService, 
               adminService: AdminService
  ){super(adminService, worldCupApiService)}

  public async getCurrentFinal(): Promise<>{
    
  }
}
