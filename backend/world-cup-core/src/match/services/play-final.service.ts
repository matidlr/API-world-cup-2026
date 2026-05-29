import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { CurrentWorldCupApiResponse } from '../model/play-final-service.interface';
import { WorldCupFeatureApiService } from 'src/basic/world-cup-feature-api.service';
import { WorldCupCoreErrorCode } from 'src/basic/model/world-cup-core-error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap } from 'src/basic/error/error.utils';

const PLAY_FINAL_UNAVAILABLE_MESSAGE =
  'World Cup simulation is not available yet. Run simulation first.';

const SIMULATION_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
    message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
    message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
};

const PLAY_FINAL_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_FETCH_FAILED,
  message: 'Unable to load simulation data from World Cup API.',
  statusCode: HttpStatus.BAD_GATEWAY,
};

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
        throw this.createPlayFinalUnavailableException();
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

  private createPlayFinalUnavailableException(): HttpException {
      return new HttpException(
        {
          messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
          message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
        },
        HttpStatus.CONFLICT,
      );
    }
}


 
