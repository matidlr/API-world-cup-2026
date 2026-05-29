import { Injectable } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { CurrentWorldCupApiResponse } from '../model/play-final-service.interface';
import { WorldCupFeatureApiService } from 'src/basic/world-cup-feature-api.service';

@Injectable()
export class PlayFinalService extends AbstractBaseService {
  constructor( private readonly worldCupfeatureApiService: WorldCupFeatureApiService, 
               adminService: AdminService
  ){super(adminService)}

  public async getCurrentFinal(lang?: string): Promise<CurrentWorldCupApiResponse>{
    const resolvedLang = this.resolveLang(lang);
    try {

          const worldCup: CurrentWorldCupApiResponse = await this.worldCupfeatureApiService.getCurrentWorldCup(
        resolvedLang,
      );

      if (!this.hasFinalists(worldCup)) {
        throw this.si;
      }

      return this.buildSimulationScreen(worldCup, resolvedLang);
    } catch (error) {
      
    }
  }

  private hasFinalists(worldCup: CurrentWorldCupApiResponse): boolean {
    return Boolean(
      worldCup?.finalHomeTeamId &&
      worldCup?.finalHomeTeamName &&
      worldCup?.finalAwayTeamId &&
      worldCup?.finalAwayTeamName,
    );
  }
}


 
