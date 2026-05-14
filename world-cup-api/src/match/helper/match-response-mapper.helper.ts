import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'src/i18n/i18n.service';
import {
  BuildMatchResponseParams,
  MatchResponseMapperHelperContract,
} from '../interfaces/match-response-mapper.interface';
import { MatchCurrentContext } from '../interfaces/match-current-context.interface';
import { MatchOption } from '../model/match-option.model';
import { MatchLanguage } from '../model/match-language.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchEntity } from '../entity/match.entity';
import { MatchResult } from '../model/match-result.enum';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchResponse } from '../model/match-response.model';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchFinalMessageHelper } from './match-final-message.helper';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';

@Injectable()
/**
 * Maps match persistence entities into API response contracts.
 */
export class MatchResponseMapperHelper
  extends AbstractMatchI18nHelper
  implements MatchResponseMapperHelperContract
{
  constructor(
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly matchFinalMessageHelper: MatchFinalMessageHelper,
  ) {
    super();
  }

  safeParseCurrentContext(raw: string | null | undefined): MatchCurrentContext | null {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as MatchCurrentContext;
    } catch {
      return null;
    }
  }

  safeParseOptions(optionsJson: string): MatchOption[] {
    try {
      const parsed = JSON.parse(optionsJson) as MatchOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  localizeOptions(options: MatchOption[], language: MatchLanguage): MatchOption[] {
    return options.map((option) => ({
      index: option.index,
      action: option.action,
      label: this.getActionLabel(option.action, language, option.label),
    }));
  }

  resolveMatchResult(match: MatchEntity): MatchResult | null {
    if (!match.isFinished) {
      return null;
    }

    if (match.scoreTeam > match.scoreOpponent) {
      return MatchResult.WIN;
    }

    if (match.scoreTeam < match.scoreOpponent) {
      return MatchResult.LOSS;
    }

    return null;
  }

  buildMatchResponse(params: BuildMatchResponseParams): MatchResponse {
    const fallbackHeadline =
      params.match.message || this.matchFinalMessageHelper.buildFinalMessageLocalized(params.match, params.language);
    const resolvedMessageItems =
      params.messageItems && params.messageItems.length > 0
        ? params.messageItems
        : [
            {
              messageKey: null,
              type: MatchMessageType.INFO,
              text: fallbackHeadline,
              minute: params.match.minute,
              turn: params.match.turn,
              teamId: params.match.teamId,
              teamName: params.match.teamName,
              playerName: null,
            },
          ];

    const resolvedContext =
      params.currentContext || this.safeParseCurrentContext(params.match.lastContextJson);

    return {
      matchId: params.match.matchId,
      teamId: params.match.teamId,
      teamName: params.match.teamName,
      opponentId: params.match.opponentId,
      opponentName: params.match.opponentName,
      messageItems: resolvedMessageItems,
      score: `${params.match.scoreTeam}-${params.match.scoreOpponent}`,
      minute: params.match.minute,
      turn: params.match.turn,
      zone: (params.match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD,
      possession: (params.match.possessionTeam as MatchPossession) || MatchPossession.USER,
      ballCarrier:
        params.match.ballCarrierName || this.i18nService.t('match.fallback.unknownPlayer', params.language),
      teamStrategy: this.matchTacticalHelper.parseStrategy(params.match.strategy),
      teamFormation: this.matchTacticalHelper.parseFormation(params.match.formation),
      teamCoachName: params.coachMetadata.teamCoachName,
      teamCoachProfile: params.coachMetadata.teamCoachProfile,
      opponentStrategy: this.matchTacticalHelper.parseStrategy(params.match.opponentStrategy),
      opponentFormation: this.matchTacticalHelper.parseFormation(params.match.opponentFormation),
      opponentCoachName: params.coachMetadata.opponentCoachName,
      opponentCoachProfile: params.coachMetadata.opponentCoachProfile,
      eventType: params.match.eventType as MatchEventType,
      options: this.localizeOptions(this.safeParseOptions(params.optionsJson), params.language),
      isFinished: params.match.isFinished,
      result: this.resolveMatchResult(params.match),
      currentContext: resolvedContext,
    };
  }

  getActionLabel(action: MatchAction, language: MatchLanguage, fallback?: string): string {
    return this.actionLabel(action, language, this.i18nService, this.configService, fallback);
  }
}
