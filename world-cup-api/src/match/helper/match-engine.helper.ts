import { Injectable } from '@nestjs/common';
import {
  MatchEngineContract,
  MatchEnginePreparePlayResult,
} from '../interfaces/match-engine.interface';
import { MatchResponse } from '../model/match-response.model';
import { StartFinalRequest } from '../request/start-final.request';
import { PlayRequest } from '../request/play.request';
import { MatchStartFinalHelper } from './match-start-final.helper';
import { MatchPlayPrepareHelper } from './match-play-prepare.helper';
import { MatchPlaySpecialEventsHelper } from './match-play-special-events.helper';
import { MatchPlayTurnPipelineHelper } from './match-play-turn-pipeline.helper';
import { MatchPlayPostTurnHelper } from './match-play-post-turn.helper';
import { MatchPlayResponseHelper } from './match-play-response.helper';

@Injectable()
/**
 * Lightweight match orchestrator:
 * - starts a final through dedicated helper
 * - runs the play stage chain in order
 * - delegates all gameplay rules to specialized helpers
 */
export class MatchEngine implements MatchEngineContract {
  constructor(
    private readonly matchStartFinalHelper: MatchStartFinalHelper,
    private readonly matchPlayPrepareHelper: MatchPlayPrepareHelper,
    private readonly matchPlaySpecialEventsHelper: MatchPlaySpecialEventsHelper,
    private readonly matchPlayTurnPipelineHelper: MatchPlayTurnPipelineHelper,
    private readonly matchPlayPostTurnHelper: MatchPlayPostTurnHelper,
    private readonly matchPlayResponseHelper: MatchPlayResponseHelper,
  ) {}

  async startFinal(request: StartFinalRequest): Promise<MatchResponse> {
    return await this.matchStartFinalHelper.startFinal(request);
  }

  async play(request: PlayRequest): Promise<MatchResponse> {
    let context = await this.matchPlayPrepareHelper.prepare(request);

    const specialEvents = await this.matchPlaySpecialEventsHelper.handle(context);
    if (specialEvents.handled && specialEvents.response) {
      return specialEvents.response;
    }

    context = specialEvents.context || context;
    context = await this.matchPlayTurnPipelineHelper.apply(context);
    context = await this.matchPlayPostTurnHelper.apply(context);

    return await this.matchPlayResponseHelper.build(context);
  }

  async preparePlay(request: PlayRequest): Promise<MatchEnginePreparePlayResult> {
    const context = await this.matchPlayPrepareHelper.prepare(request);
    return context.preparedTurn;
  }
}
