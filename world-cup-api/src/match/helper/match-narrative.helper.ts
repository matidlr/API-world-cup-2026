import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchEntity } from '../entity/match.entity';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchFormation } from '../model/match-formation.enum';
import { START_KICKOFF_VARIANT_COUNT } from '../model/match-engine.constants';
import { MatchLanguage } from '../model/match-language.model';

export interface LocalizedMessageBundle {
  en: string[];
  es: string[];
}

@Injectable()
/**
 * Centralizes localized narrative helpers used by the match engine.
 * Keeping these helpers out of MatchService improves readability while
 * preserving a single i18n entry point for all user-facing texts.
 */
export class MatchNarrativeHelper {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Builds kickoff narrative messages in both supported languages.
   */
  buildStartMessages(params: {
    teamName: string;
    teamFormation: MatchFormation | null;
    opponentName: string;
    opponentFormation: MatchFormation | null;
    ballCarrierName: string;
    isRivalryMatch?: boolean;
  }): LocalizedMessageBundle {
    const rivalryMessages = params.isRivalryMatch
      ? {
          en: this.i18nService.t('match.start.rivalry', 'en'),
          es: this.i18nService.t('match.start.rivalry', 'es'),
        }
      : null;

    return {
      en: [
        this.i18nService.t('match.start.header', 'en', {
          teamName: params.teamName,
          teamFormation: params.teamFormation || '-',
          opponentName: params.opponentName,
          opponentFormation: params.opponentFormation || '-',
        }),
        ...(rivalryMessages ? [rivalryMessages.en] : []),
        this.buildKickoffStartMessage('en', params.ballCarrierName, params.teamName),
      ],
      es: [
        this.i18nService.t('match.start.header', 'es', {
          teamName: params.teamName,
          teamFormation: params.teamFormation || '-',
          opponentName: params.opponentName,
          opponentFormation: params.opponentFormation || '-',
        }),
        ...(rivalryMessages ? [rivalryMessages.es] : []),
        this.buildKickoffStartMessage('es', params.ballCarrierName, params.teamName),
      ],
    };
  }

  /**
   * Selects localized messages with English fallback.
   */
  pickMessagesByLanguage(bundle: LocalizedMessageBundle, language: MatchLanguage): string[] {
    if (language === 'es' && bundle.es.length > 0) {
      return bundle.es;
    }

    return bundle.en.length > 0 ? bundle.en : bundle.es;
  }

  /**
   * Finalizes localized message list with fallback and max-size cap.
   */
  finalizeTurnMessages(params: {
    bundle: LocalizedMessageBundle;
    match: MatchEntity;
    language: MatchLanguage;
    fallbackFinalMessage: string;
    maxMessages: number;
  }): string[] {
    const { bundle, match, language, fallbackFinalMessage, maxMessages } = params;
    const selected = [...this.pickMessagesByLanguage(bundle, language)];

    if (selected.length === 0) {
      selected.push(match.message || fallbackFinalMessage);
    }

    return selected.slice(0, maxMessages);
  }

  /**
   * Localizes human-readable field zones for narratives.
   */
  describeZone(zone: MatchFieldZone, language: MatchLanguage): string {
    return this.i18nService.t(`match.zone.${zone}`, language);
  }

  private buildKickoffStartMessage(
    language: MatchLanguage,
    ballCarrierName: string,
    teamName: string,
  ): string {
    const variantIndex = this.randomInt(1, START_KICKOFF_VARIANT_COUNT);
    const variantKey = `match.start.kickoff.variant.${variantIndex}`;
    const variantText = this.i18nService.t(variantKey, language, { ballCarrierName, teamName });
    if (variantText !== variantKey) {
      return variantText;
    }

    return this.i18nService.t('match.start.kickoff', language, {
      ballCarrierName,
      teamName,
    });
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
