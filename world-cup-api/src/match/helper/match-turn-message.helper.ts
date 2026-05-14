import { Injectable } from '@nestjs/common';
import {
  AppLocale,
  DEFAULT_APP_LOCALE,
  I18nService,
  TranslationParams,
} from 'src/i18n/i18n.service';
import { MatchEntity } from '../entity/match.entity';
import {
  TurnMessageAccumulator,
  TurnMessageParams,
  TurnMessageMetadata,
} from '../interfaces/match-turn-message-accumulator.interface';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchPossession } from '../model/match-possession.enum';

@Injectable()
export class MatchTurnMessageHelper {
  constructor(private readonly i18nService: I18nService) {}

  createAccumulator(match: MatchEntity): TurnMessageAccumulator {
    const bundle = { en: [], es: [] } as { en: string[]; es: string[] };
    const items = [] as TurnMessageAccumulator['items'];

    const pushTurnMessage = (
      type: MatchMessageType,
      key: string,
      params?: TurnMessageParams,
      metadata?: TurnMessageMetadata,
    ): void => {
      const enText = this.i18nService.t(
        key,
        'en',
        this.resolveParamsByLocale(params, 'en'),
      );
      const esText = this.i18nService.t(
        key,
        'es',
        this.resolveParamsByLocale(params, 'es'),
      );
      bundle.en.push(enText);
      bundle.es.push(esText);
      items.push({
        key,
        type,
        en: enText,
        es: esText,
        minute: metadata?.minute ?? match.minute,
        turn: metadata?.turn ?? match.turn,
        teamId: metadata?.teamId,
        teamName: metadata?.teamName,
        playerName: metadata?.playerName,
      });
    };

    const pushPossessionConsequenceMessage = (
      sourcePossession: MatchPossession,
      resolvedPossession: MatchPossession,
      minute: number,
      turn: number,
    ): void => {
      const carrierTeamId =
        resolvedPossession === MatchPossession.USER ? match.teamId : match.opponentId;
      const carrierTeamName =
        resolvedPossession === MatchPossession.USER ? match.teamName : match.opponentName;
      const carrierNameEn =
        match.ballCarrierName || this.i18nService.t('match.fallback.unknownPlayer', 'en');
      const carrierNameEs =
        match.ballCarrierName || this.i18nService.t('match.fallback.unknownPlayer', 'es');

      const consequenceKey =
        resolvedPossession === MatchPossession.USER
          ? sourcePossession === MatchPossession.USER
            ? 'match.turn.consequence.userKeepsBall'
            : 'match.turn.consequence.userRecoversBall'
          : sourcePossession === MatchPossession.USER
            ? 'match.turn.consequence.opponentInterception'
            : 'match.turn.consequence.opponentKeepsBall';

      pushTurnMessage(
        MatchMessageType.OPPONENT_REACTION,
        consequenceKey,
        {
          en: {
            playerName: carrierNameEn,
            teamName: carrierTeamName,
          },
          es: {
            playerName: carrierNameEs,
            teamName: carrierTeamName,
          },
        },
        {
          minute,
          turn,
          teamId: carrierTeamId,
          teamName: carrierTeamName,
          playerName: match.ballCarrierName || null,
        },
      );
    };

    return {
      bundle,
      items,
      pushTurnMessage,
      pushPossessionConsequenceMessage,
    };
  }

  private resolveParamsByLocale(
    params: TurnMessageParams | undefined,
    locale: AppLocale,
  ): TranslationParams | undefined {
    if (!params) {
      return undefined;
    }

    if (typeof params === 'function') {
      return params(this.i18nService.resolveLocale(locale));
    }

    if (this.isPerLocaleParams(params)) {
      const normalizedLocale = this.i18nService.resolveLocale(locale);
      const defaultLocale = DEFAULT_APP_LOCALE;
      return params[normalizedLocale] || params[defaultLocale];
    }

    return params;
  }

  private isPerLocaleParams(
    params: TurnMessageParams,
  ): params is Partial<Record<AppLocale, TranslationParams>> {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      return false;
    }

    const casted = params as Partial<Record<AppLocale, unknown>>;
    return this.isTranslationObject(casted.en) || this.isTranslationObject(casted.es);
  }

  private isTranslationObject(value: unknown): value is TranslationParams {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
