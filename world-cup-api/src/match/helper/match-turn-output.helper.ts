import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../interfaces/match-localized-turn-message.interface';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MIN_MESSAGES_PER_TURN } from '../model/match-engine.constants';
import { MatchNarrativeHelper } from './match-narrative.helper';

@Injectable()
export class MatchTurnOutputHelper {
  constructor(
    private readonly i18nService: I18nService,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
  ) {}

  finalizeTurnOutput(params: {
    bundle: LocalizedTurnMessages;
    localizedItems: LocalizedTurnMessageItem[];
    match: MatchEntity;
    language: MatchLanguage;
    fallbackFinalMessage: string;
    maxMessagesPerTurn: number;
  }): { headline: string; messageItems: MatchMessageItem[] } {
    const { bundle, localizedItems, match, language, fallbackFinalMessage, maxMessagesPerTurn } = params;

    if (bundle.en.length === 0 || bundle.es.length === 0) {
      const fallbackEn = match.message || fallbackFinalMessage;
      const fallbackEs = match.message || fallbackFinalMessage;
      bundle.en.push(fallbackEn);
      bundle.es.push(fallbackEs);
      localizedItems.push({
        key: 'match.turn.fallback',
        type: MatchMessageType.INFO,
        en: fallbackEn,
        es: fallbackEs,
        minute: match.minute,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
      });
    }

    if (bundle.en.length < MIN_MESSAGES_PER_TURN || bundle.es.length < MIN_MESSAGES_PER_TURN) {
      const scoreMessageEn = this.i18nService.t('match.turn.currentScore', 'en', {
        scoreTeam: match.scoreTeam,
        scoreOpponent: match.scoreOpponent,
      });
      const scoreMessageEs = this.i18nService.t('match.turn.currentScore', 'es', {
        scoreTeam: match.scoreTeam,
        scoreOpponent: match.scoreOpponent,
      });
      bundle.en.push(scoreMessageEn);
      bundle.es.push(scoreMessageEs);
      localizedItems.push({
        key: 'match.turn.currentScore',
        type: MatchMessageType.INFO,
        en: scoreMessageEn,
        es: scoreMessageEs,
        minute: match.minute,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
      });
    }

    const localizedTexts = this.matchNarrativeHelper.pickMessagesByLanguage(bundle, language);
    const localizedResponseAll = this.localizeMessageItems(localizedItems, language);
    const totalItems = Math.min(localizedTexts.length, localizedResponseAll.length);
    const selectedIndices = this.resolveSelectedIndices({
      totalItems,
      maxMessagesPerTurn,
      localizedItems,
    });
    const messages = selectedIndices.map((index) => localizedTexts[index]).filter(Boolean);
    const localizedResponseItems = selectedIndices
      .map((index) => localizedResponseAll[index])
      .filter(Boolean);
    this.assignChronologicalMinutes(localizedResponseItems, match);

    while (localizedResponseItems.length < messages.length) {
      const text = messages[localizedResponseItems.length];
      localizedResponseItems.push({
        messageKey: null,
        type: MatchMessageType.INFO,
        text,
        minute: match.minute,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
        playerName: null,
      });
    }

    return {
      headline: messages[0] || fallbackFinalMessage,
      messageItems: localizedResponseItems,
    };
  }

  private resolveSelectedIndices(params: {
    totalItems: number;
    maxMessagesPerTurn: number;
    localizedItems: LocalizedTurnMessageItem[];
  }): number[] {
    const { totalItems, maxMessagesPerTurn, localizedItems } = params;
    if (totalItems <= 0) {
      return [];
    }

    const cappedLength = Math.min(totalItems, maxMessagesPerTurn);
    const selected = new Set<number>(Array.from({ length: cappedLength }, (_, index) => index));
    if (totalItems <= maxMessagesPerTurn) {
      return Array.from(selected).sort((a, b) => a - b);
    }

    const mandatoryIndices = this.resolveMandatoryHalfTimeIndices(localizedItems, totalItems);
    if (mandatoryIndices.length === 0) {
      return Array.from(selected).sort((a, b) => a - b);
    }

    const mandatorySet = new Set(mandatoryIndices);
    for (const mandatoryIndex of mandatoryIndices) {
      if (selected.has(mandatoryIndex)) {
        continue;
      }

      const replaceable = Array.from(selected)
        .sort((a, b) => b - a)
        .find((index) => !mandatorySet.has(index));

      if (replaceable === undefined) {
        continue;
      }

      selected.delete(replaceable);
      selected.add(mandatoryIndex);
    }

    return Array.from(selected).sort((a, b) => a - b);
  }

  private resolveMandatoryHalfTimeIndices(
    localizedItems: LocalizedTurnMessageItem[],
    totalItems: number,
  ): number[] {
    const indices: number[] = [];

    for (let index = 0; index < totalItems; index += 1) {
      const key = localizedItems[index]?.key;
      if (!key) {
        continue;
      }

      if (
        key.startsWith('match.halftime.summary.') ||
        key.startsWith('match.halftime.variant.') ||
        key === 'match.halftime.prompt'
      ) {
        indices.push(index);
      }
    }

    return indices;
  }

  private localizeMessageItems(
    items: LocalizedTurnMessageItem[],
    language: MatchLanguage,
  ): MatchMessageItem[] {
    return items.map((item) => ({
      messageKey: item.key ?? null,
      type: item.type,
      text: language === 'es' ? item.es : item.en,
      minute: item.minute ?? 0,
      turn: item.turn ?? 0,
      teamId: item.teamId ?? null,
      teamName: item.teamName ?? null,
      playerName: item.playerName ?? null,
    }));
  }

  private assignChronologicalMinutes(items: MatchMessageItem[], match: MatchEntity): void {
    if (items.length <= 1) {
      return;
    }

    const upperBound = Math.max(1, Math.min(90, match.minute || 90));
    let index = 0;

    while (index < items.length) {
      const baseMinute = Math.max(1, Math.min(upperBound, items[index].minute || 1));
      let clusterEnd = index;
      while (
        clusterEnd + 1 < items.length &&
        (items[clusterEnd + 1].minute || 0) === (items[index].minute || 0)
      ) {
        clusterEnd += 1;
      }

      if (clusterEnd === index) {
        items[index].minute = baseMinute;
        index += 1;
        continue;
      }

      const clusterSize = clusterEnd - index + 1;
      const previousMinute = index > 0 ? items[index - 1].minute : 0;
      const nextAnchorMinute = this.findNextAnchorMinute(items, clusterEnd + 1, upperBound);
      const maxSpreadEnd = Math.max(baseMinute, nextAnchorMinute - 1);

      let startMinute = baseMinute;
      if (startMinute + clusterSize - 1 > maxSpreadEnd) {
        startMinute = Math.max(previousMinute + 1, maxSpreadEnd - clusterSize + 1);
      }

      for (let offset = 0; offset < clusterSize; offset += 1) {
        const minute = Math.max(1, Math.min(maxSpreadEnd, startMinute + offset));
        items[index + offset].minute = minute;
      }

      index = clusterEnd + 1;
    }
  }

  private findNextAnchorMinute(
    items: MatchMessageItem[],
    fromIndex: number,
    fallback: number,
  ): number {
    for (let i = fromIndex; i < items.length; i += 1) {
      const minute = items[i].minute || 0;
      if (minute > 0) {
        return minute;
      }
    }

    return fallback;
  }
}
