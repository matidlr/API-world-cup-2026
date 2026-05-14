import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { I18nService } from '../../src/i18n/i18n.service';
import { MatchFormation } from '../../src/match/model/match-formation.enum';
import { MatchPlayPrepareHelper } from '../../src/match/helper/match-play-prepare.helper';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';
import { MatchStrategy } from '../../src/match/model/match-strategy.enum';

function assertStrategyShiftKeyExists(i18nService: I18nService): void {
  const interpolation = {
    coachName: 'Lionel Scaloni',
    teamName: 'Argentina',
    strategy: MatchStrategy.ATTACK,
    formation: MatchFormation.F_4_4_2,
    previousStrategy: MatchStrategy.DEFENSE,
    previousFormation: MatchFormation.F_5_4_1,
  };

  for (const strategy of Object.values(MatchStrategy)) {
    for (const variant of [1, 2]) {
      const key = `match.tactics.userShift.${strategy}.${variant}`;
      const en = i18nService.t(key, 'en', interpolation);
      const es = i18nService.t(key, 'es', interpolation);
      assert.notEqual(en, key, `Missing EN translation for ${key}`);
      assert.notEqual(es, key, `Missing ES translation for ${key}`);
    }
  }

  const fallbackKey = 'match.tactics.userShift';
  const fallbackEn = i18nService.t(fallbackKey, 'en', interpolation);
  const fallbackEs = i18nService.t(fallbackKey, 'es', interpolation);
  assert.notEqual(fallbackEn, fallbackKey, `Missing EN fallback translation for ${fallbackKey}`);
  assert.notEqual(fallbackEs, fallbackKey, `Missing ES fallback translation for ${fallbackKey}`);
}

function assertShiftDetectionLogic(): void {
  const resolveShift = (MatchPlayPrepareHelper.prototype as unknown as {
    resolveUserTacticalShift: (input: {
      previousStrategy: MatchStrategy | null;
      previousFormation: MatchFormation | null;
      strategy: MatchStrategy | null;
      formation: MatchFormation | null;
    }) => {
      previousStrategy: MatchStrategy;
      previousFormation: MatchFormation;
      strategy: MatchStrategy;
      formation: MatchFormation;
    } | null;
  }).resolveUserTacticalShift;

  const unchanged = resolveShift.call({}, {
    previousStrategy: MatchStrategy.ATTACK,
    previousFormation: MatchFormation.F_4_3_3,
    strategy: MatchStrategy.ATTACK,
    formation: MatchFormation.F_4_3_3,
  });
  assert.equal(unchanged, null, 'Expected no tactical shift when strategy and formation are unchanged.');

  const changed = resolveShift.call({}, {
    previousStrategy: MatchStrategy.ATTACK,
    previousFormation: MatchFormation.F_4_3_3,
    strategy: MatchStrategy.POSSESSION,
    formation: MatchFormation.F_4_2_3_1,
  });
  assert.deepEqual(
    changed,
    {
      previousStrategy: MatchStrategy.ATTACK,
      previousFormation: MatchFormation.F_4_3_3,
      strategy: MatchStrategy.POSSESSION,
      formation: MatchFormation.F_4_2_3_1,
    },
    'Expected tactical shift payload when strategy/formation changes.',
  );
}

function assertPipelineResolverLogic(i18nService: I18nService): void {
  const resolveKey = (MatchPlayTurnPipelineHelper.prototype as unknown as {
    resolveUserTacticalShiftMessageKey: (strategy: MatchStrategy) => string;
  }).resolveUserTacticalShiftMessageKey;

  for (const strategy of Object.values(MatchStrategy)) {
    const first = resolveKey.call(
      {
        i18nService,
        randomInt: () => 1,
      },
      strategy,
    );
    assert.equal(
      first,
      `match.tactics.userShift.${strategy}.1`,
      `Expected deterministic variant .1 for ${strategy}`,
    );

    const second = resolveKey.call(
      {
        i18nService,
        randomInt: () => 2,
      },
      strategy,
    );
    assert.equal(
      second,
      `match.tactics.userShift.${strategy}.2`,
      `Expected deterministic variant .2 for ${strategy}`,
    );
  }

  const fallback = resolveKey.call(
    {
      i18nService,
      randomInt: () => 1,
    },
    'UNKNOWN' as unknown as MatchStrategy,
  );
  assert.equal(
    fallback,
    'match.tactics.userShift',
    'Expected generic fallback for unknown strategy key.',
  );
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const i18nService = app.get(I18nService);
    assertStrategyShiftKeyExists(i18nService);
    assertShiftDetectionLogic();
    assertPipelineResolverLogic(i18nService);
    console.log('OK - user tactical shift messaging coverage passed.');
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

