import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchPlaySpecialEventsHelperContract } from '../interfaces/match-play-special-events.interface';
import {
  MatchPlaySpecialEventsResult,
  MatchPlayStageContext,
} from '../interfaces/match-play-stage.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchPlaySpecialEventResponseHelper } from './match-play-special-event-response.helper';

@Injectable()
export class MatchPlaySpecialEventsHelper implements MatchPlaySpecialEventsHelperContract {
  constructor(
    private readonly matchPlaySpecialEventResponseHelper: MatchPlaySpecialEventResponseHelper,
  ) {}

  async handle(context: MatchPlayStageContext): Promise<MatchPlaySpecialEventsResult> {
    const eventType = context.preparedTurn.currentEventType;
    const selectedAction = context.selectedAction;

    switch (selectedAction) {
      case MatchAction.QUIT_MATCH:
        return {
          handled: true,
          response: await this.matchPlaySpecialEventResponseHelper.resolveQuitMatch(
            context.preparedTurn,
          ),
        };
      case MatchAction.RESTART_MATCH:
        if (eventType !== MatchEventType.HALF_TIME_EVENT) {
          throw new BadRequestException(ApiErrorCode.INVALID_SELECTED_OPTION);
        }
        break;
      default:
        break;
    }

    switch (eventType) {
      case MatchEventType.HALF_TIME_EVENT:
        return {
          handled: true,
          response: await this.matchPlaySpecialEventResponseHelper.resolveHalfTimeRestart(
            context.preparedTurn,
          ),
        };
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        return {
          handled: true,
          response: await this.matchPlaySpecialEventResponseHelper.resolveLastPlayEvent(
            context.preparedTurn,
          ),
        };
      default:
        break;
    }

    return {
      handled: false,
      context,
    };
  }
}
