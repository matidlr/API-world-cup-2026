import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { I18nService } from '../../src/i18n/i18n.service';
import { MatchEntity } from '../../src/match/entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../../src/match/interfaces/match-localized-turn-message.interface';
import { MatchLanguage } from '../../src/match/model/match-language.model';
import { MatchMessageType } from '../../src/match/model/match-message-type.enum';
import { MatchNarrativeHelper } from '../../src/match/helper/match-narrative.helper';
import { MatchTurnOutputHelper } from '../../src/match/helper/match-turn-output.helper';

function buildItem(params: {
  key: string;
  en: string;
  es: string;
  type?: MatchMessageType;
}): LocalizedTurnMessageItem {
  return {
    key: params.key,
    type: params.type || MatchMessageType.INFO,
    en: params.en,
    es: params.es,
    minute: 45,
    turn: 5,
    teamId: 'arg',
    teamName: 'Argentina',
    playerName: null,
  };
}

function run(): void {
  const i18nService = new I18nService();
  const narrativeHelper = new MatchNarrativeHelper(i18nService);
  const helper = new MatchTurnOutputHelper(i18nService, narrativeHelper);

  const bundle: LocalizedTurnMessages = { en: [], es: [] };
  const items: LocalizedTurnMessageItem[] = [];

  for (let i = 1; i <= 12; i += 1) {
    const item = buildItem({
      key: `match.noise.${i}`,
      en: `Noise EN ${i}`,
      es: `Ruido ES ${i}`,
    });
    bundle.en.push(item.en);
    bundle.es.push(item.es);
    items.push(item);
  }

  const halfSummary = buildItem({
    key: 'match.halftime.summary.drawing',
    en: 'Halftime summary EN',
    es: 'Resumen de entretiempo ES',
  });
  const halfVariant = buildItem({
    key: 'match.halftime.variant.4',
    en: 'Coach comment EN',
    es: 'Comentario de técnicos ES',
  });
  const halfPrompt = buildItem({
    key: 'match.halftime.prompt',
    en: 'Halftime prompt EN',
    es: 'Prompt de entretiempo ES',
  });

  for (const item of [halfSummary, halfVariant, halfPrompt]) {
    bundle.en.push(item.en);
    bundle.es.push(item.es);
    items.push(item);
  }

  const output = helper.finalizeTurnOutput({
    bundle,
    localizedItems: items,
    match: {
      teamId: 'arg',
      teamName: 'Argentina',
      minute: 45,
      turn: 5,
      scoreTeam: 0,
      scoreOpponent: 0,
      message: 'Fallback',
    } as MatchEntity,
    language: 'es' as MatchLanguage,
    fallbackFinalMessage: 'Fallback',
    maxMessagesPerTurn: 8,
  });

  const texts = output.messageItems.map((item) => item.text);
  assert.ok(
    texts.includes('Resumen de entretiempo ES'),
    `Expected halftime summary to survive truncation. messages=${JSON.stringify(texts, null, 2)}`,
  );
  assert.ok(
    texts.includes('Comentario de técnicos ES'),
    `Expected halftime coach comment to survive truncation. messages=${JSON.stringify(texts, null, 2)}`,
  );
  assert.ok(
    texts.includes('Prompt de entretiempo ES'),
    `Expected halftime prompt to survive truncation. messages=${JSON.stringify(texts, null, 2)}`,
  );

  console.log('OK - halftime narrative pinning survives truncation.');
}

run();
