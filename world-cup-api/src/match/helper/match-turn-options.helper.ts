import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'src/i18n/i18n.service';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import {
  BuildMatchTurnOptionsParams,
  MatchTurnOptionsHelperContract,
  PickOpponentActionParams,
  ResolveActionPoolParams,
  ResolveTurnSelectedActionsParams,
  ResolveUserActionPoolParams,
} from '../interfaces/match-turn-options.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchOption } from '../model/match-option.model';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchContextBuilderHelper } from './match-context-builder.helper';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';

@Injectable()
/**
 * Builds user-visible action options and opponent fallback actions from event context.
 */
export class MatchTurnOptionsHelper
  extends AbstractMatchI18nHelper
  implements MatchTurnOptionsHelperContract
{
  constructor(
    private readonly matchContextBuilderHelper: MatchContextBuilderHelper,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  buildOptions(params: BuildMatchTurnOptionsParams): MatchOption[] {
    const pool = this.resolveUserActionPoolForTurn({
      eventType: params.eventType,
      possession: params.possession,
      zone: params.zone,
      actionsByEvent: params.actionsByEvent,
    });
    if (!pool.length) {
      return [];
    }

    if (
      params.eventType === MatchEventType.HALF_TIME_EVENT &&
      pool.includes(MatchAction.RESTART_MATCH) &&
      pool.includes(MatchAction.QUIT_MATCH)
    ) {
      return [
        {
          index: 1,
          label: this.getActionLabel(MatchAction.RESTART_MATCH, params.language),
          action: MatchAction.RESTART_MATCH,
        },
        {
          index: 2,
          label: this.getActionLabel(MatchAction.QUIT_MATCH, params.language),
          action: MatchAction.QUIT_MATCH,
        },
      ];
    }

    const selectedActions = this.resolveTurnSelectedActions({
      eventType: params.eventType,
      possession: params.possession,
      zone: params.zone,
      pool,
    });

    const regularOptions = selectedActions.map((action, index) => ({
      index: index + 1,
      label: this.getActionLabel(action, params.language),
      action,
    }));

    return [
      ...regularOptions,
      {
        index: 4,
        label: this.getActionLabel(MatchAction.QUIT_MATCH, params.language),
        action: MatchAction.QUIT_MATCH,
      },
    ];
  }

  pickOpponentAction(params: PickOpponentActionParams): MatchAction {
    const pool = this.resolveActionPoolForTurn({
      eventType: params.eventType,
      possession:
        params.possession === MatchPossession.USER ? MatchPossession.OPPONENT : MatchPossession.USER,
      actionsByEvent: params.actionsByEvent,
    });
    const valid = pool.filter((action) => action !== MatchAction.QUIT_MATCH);

    if (!valid.length) {
      return MatchAction.ATTACK;
    }

    return this.pick(valid);
  }

  private resolveActionPoolForTurn(params: ResolveActionPoolParams): MatchAction[] {
    return this.matchContextBuilderHelper.getActionPoolForTurn(
      params.eventType,
      params.possession,
      params.actionsByEvent,
    );
  }

  private resolveUserActionPoolForTurn(params: ResolveUserActionPoolParams): MatchAction[] {
    return this.matchContextBuilderHelper.getAvailableActions(
      params.eventType,
      params.zone,
      params.possession,
      params.actionsByEvent,
    );
  }

  private resolveTurnSelectedActions(params: ResolveTurnSelectedActionsParams): MatchAction[] {
    const mustIncludeShoot =
      params.pool.includes(MatchAction.SHOOT) &&
      (params.eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT ||
        (params.possession === MatchPossession.USER &&
          (params.zone === MatchFieldZone.ATTACK_THIRD || params.zone === MatchFieldZone.BOX)));

    if (!mustIncludeShoot) {
      return this.sampleActions(params.pool, 3);
    }

    const poolWithoutShoot = params.pool.filter((action) => action !== MatchAction.SHOOT);
    const sampled = this.sampleActions(poolWithoutShoot, 2);
    return [MatchAction.SHOOT, ...sampled];
  }

  private sampleActions(actions: MatchAction[], count: number): MatchAction[] {
    const source = [...actions];
    const picked: MatchAction[] = [];

    while (picked.length < count && source.length > 0) {
      const index = this.randomInt(0, source.length - 1);
      const [action] = source.splice(index, 1);
      picked.push(action);
    }

    if (picked.length < count) {
      throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
    }

    return picked;
  }

  private getActionLabel(action: MatchAction, language: MatchLanguage, fallback?: string): string {
    return this.actionLabel(action, language, this.i18nService, this.configService, fallback);
  }
}
