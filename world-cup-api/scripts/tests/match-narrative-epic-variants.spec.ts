import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { I18nService } from '../../src/i18n/i18n.service';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';

const ACTIONS_WITH_TURN_VARIANTS: MatchAction[] = [
  MatchAction.ATTACK,
  MatchAction.HOLD,
  MatchAction.PRESS,
  MatchAction.LONG_PASS,
  MatchAction.SHOOT,
  MatchAction.PASS,
  MatchAction.DRIBBLE,
  MatchAction.CROSS,
  MatchAction.DEFEND,
  MatchAction.LEFT,
  MatchAction.RIGHT,
  MatchAction.CENTER,
  MatchAction.PICAR,
  MatchAction.DIVE_LEFT,
  MatchAction.DIVE_RIGHT,
  MatchAction.STAY_CENTER,
  MatchAction.WAIT,
  MatchAction.BLOCK,
  MatchAction.TACKLE,
];

const VARIANT_COUNT = 15;
const START_KICKOFF_VARIANT_COUNT = 5;

function assertKeyExists(i18n: I18nService, locale: 'en' | 'es', key: string): void {
  const resolved = i18n.t(key, locale);
  assert.notEqual(resolved, key, `Missing translation key [${locale}]: ${key}`);
}

function run(): void {
  const i18n = new I18nService();

  (['en', 'es'] as const).forEach((locale) => {
    for (let idx = 1; idx <= START_KICKOFF_VARIANT_COUNT; idx += 1) {
      assertKeyExists(i18n, locale, `match.start.kickoff.variant.${idx}`);
    }

    ACTIONS_WITH_TURN_VARIANTS.forEach((action) => {
      for (let idx = 1; idx <= VARIANT_COUNT; idx += 1) {
        assertKeyExists(i18n, locale, `match.turn.context.${action}.${idx}`);
        assertKeyExists(i18n, locale, `match.turn.result.success.${action}.${idx}`);
        assertKeyExists(i18n, locale, `match.turn.result.fail.${action}.${idx}`);
      }
    });

    (Object.values(MatchActionOutcome) as MatchActionOutcome[]).forEach((outcome) => {
      for (let idx = 1; idx <= VARIANT_COUNT; idx += 1) {
        assertKeyExists(i18n, locale, `match.turn.result.outcome.${outcome}.${idx}`);
      }
    });
  });

  // eslint-disable-next-line no-console
  console.log('✅ match-narrative-epic-variants: all 15 variants exist for EN/ES.');
}

run();
