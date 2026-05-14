import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { MatchService } from '../../src/match/match.service';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchMessageItem } from '../../src/match/model/match-message-item.model';
import { MatchMessageType } from '../../src/match/model/match-message-type.enum';
import { MatchResponse } from '../../src/match/model/match-response.model';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { WorldCupService } from '../../src/world-cup/world-cup.service';

const FOLLOW_UP_ACTION_PRIORITY: MatchAction[] = [
  MatchAction.PASS,
  MatchAction.LONG_PASS,
  MatchAction.HOLD,
  MatchAction.ATTACK,
  MatchAction.DRIBBLE,
  MatchAction.SHOOT,
  MatchAction.CROSS,
  MatchAction.PRESS,
  MatchAction.DEFEND,
  MatchAction.BLOCK,
  MatchAction.TACKLE,
  MatchAction.RESTART_MATCH,
];

const DEFENSIVE_ACTION_PRIORITY: MatchAction[] = [
  MatchAction.PRESS,
  MatchAction.DEFEND,
  MatchAction.BLOCK,
  MatchAction.TACKLE,
];

function resolveNarratedActor(messages: MatchMessageItem[]): MatchMessageItem | null {
  return (
    messages.find(
      (message) => message.type === MatchMessageType.CONTEXT && Boolean(message.playerName),
    ) ||
    messages.find(
      (message) => message.type === MatchMessageType.PLAYER_ACTION && Boolean(message.playerName),
    ) ||
    messages.find(
      (message) =>
        message.type === MatchMessageType.PLAYER_ACTION || message.type === MatchMessageType.CONTEXT,
    ) ||
    null
  );
}

function resolveMessageDelta(previous: MatchResponse, next: MatchResponse): MatchMessageItem[] {
  const toSignature = (message: MatchMessageItem) =>
    [
      String(message.turn ?? ''),
      String(message.minute ?? ''),
      message.type ?? '',
      message.teamId ?? '',
      message.playerName ?? '',
      message.text ?? '',
    ].join('|');

  const previousSignatures = new Set(previous.messageItems.map(toSignature));
  const diff = next.messageItems.filter((message) => !previousSignatures.has(toSignature(message)));

  if (diff.length > 0) {
    return diff;
  }

  return next.messageItems.slice(Math.max(0, next.messageItems.length - 8));
}

function resolveExpectedActor(state: MatchResponse): string {
  return state.currentContext?.actingPlayer?.name || state.ballCarrier;
}

function pickActionOption(state: MatchResponse, action: MatchAction) {
  return state.options.find((option) => option.action === action);
}

function pickProgressionOption(state: MatchResponse) {
  for (const action of FOLLOW_UP_ACTION_PRIORITY) {
    const option = state.options.find((candidate) => candidate.action === action);
    if (option) {
      return option;
    }
  }

  return state.options[0];
}

async function ensureStartedMatch(
  matchService: MatchService,
  worldCupService: WorldCupService,
): Promise<MatchResponse> {
  try {
    return await matchService.startFinal({ teamId: 'arg', lang: 'en' });
  } catch {
    try {
      return await matchService.startFinal({ lang: 'en' });
    } catch {
      await worldCupService.simulateWorldCup({ teamId: 'arg' });
      return await matchService.startFinal({ teamId: 'arg', lang: 'en' });
    }
  }
}

async function executeAndAssertActorConsistency(params: {
  matchService: MatchService;
  previousState: MatchResponse;
  selectedOptionIndex: number;
  expectedActor?: string;
  expectedTeamId?: string;
  label: string;
}): Promise<MatchResponse> {
  const {
    matchService,
    previousState,
    selectedOptionIndex,
    expectedActor,
    expectedTeamId,
    label,
  } = params;

  const nextState = await matchService.play({
    selectedOption: selectedOptionIndex,
    lang: 'en',
  });

  const delta = resolveMessageDelta(previousState, nextState);
  const narratedAction = resolveNarratedActor(delta);

  assert.ok(
    narratedAction,
    `${label}: expected PLAYER_ACTION/CONTEXT message in delta. delta=${JSON.stringify(delta, null, 2)}`,
  );

  if (expectedActor) {
    assert.equal(
      narratedAction?.playerName,
      expectedActor,
      `${label}: narrated actor mismatch. expected=${expectedActor} actual=${narratedAction?.playerName}. narrated=${JSON.stringify(
        narratedAction,
        null,
        2,
      )} delta=${JSON.stringify(delta, null, 2)}`,
    );
  }

  if (expectedTeamId) {
    assert.equal(
      narratedAction?.teamId,
      expectedTeamId,
      `${label}: narrated team mismatch. expectedTeam=${expectedTeamId} actualTeam=${narratedAction?.teamId}. narrated=${JSON.stringify(
        narratedAction,
        null,
        2,
      )} delta=${JSON.stringify(delta, null, 2)}`,
    );
  }

  return nextState;
}

async function runActionContinuityScenario(params: {
  targetAction: MatchAction;
  matchService: MatchService;
  worldCupService: WorldCupService;
}): Promise<void> {
  const { targetAction, matchService, worldCupService } = params;

  let state = await ensureStartedMatch(matchService, worldCupService);

  for (let step = 0; step < 140; step += 1) {
    if (state.isFinished) {
      state = await ensureStartedMatch(matchService, worldCupService);
      continue;
    }

    const targetOption = pickActionOption(state, targetAction);

    if (targetOption && state.currentContext?.possession === MatchPossession.USER) {
      const firstExpectedActor = resolveExpectedActor(state);
      const afterTarget = await executeAndAssertActorConsistency({
        matchService,
        previousState: state,
        selectedOptionIndex: targetOption.index,
        expectedActor: firstExpectedActor,
        label: `${targetAction} primary action`,
      });

      if (afterTarget.isFinished) {
        return;
      }

      const followUpOption = pickProgressionOption(afterTarget);
      assert.ok(
        followUpOption,
        `${targetAction}: no follow-up option available after executing target action.`,
      );

      if (followUpOption.action === MatchAction.RESTART_MATCH) {
        await matchService.play({
          selectedOption: followUpOption.index,
          lang: 'en',
        });
        return;
      }

      const secondExpectedActor = resolveExpectedActor(afterTarget);
      if (afterTarget.currentContext?.possession === MatchPossession.USER) {
        await executeAndAssertActorConsistency({
          matchService,
          previousState: afterTarget,
          selectedOptionIndex: followUpOption.index,
          expectedActor: secondExpectedActor,
          label: `${targetAction} follow-up action (user possession)`,
        });
      } else {
        await executeAndAssertActorConsistency({
          matchService,
          previousState: afterTarget,
          selectedOptionIndex: followUpOption.index,
          expectedTeamId: afterTarget.teamId,
          label: `${targetAction} follow-up action (opponent possession)`,
        });
      }

      return;
    }

    const progressionOption = pickProgressionOption(state);
    assert.ok(progressionOption, `${targetAction}: no progression option available.`);

    state = await matchService.play({
      selectedOption: progressionOption.index,
      lang: 'en',
    });
  }

  assert.fail(`${targetAction}: could not execute target scenario within step budget.`);
}

async function runDefensivePerspectiveScenario(params: {
  matchService: MatchService;
  worldCupService: WorldCupService;
}): Promise<void> {
  const { matchService, worldCupService } = params;
  let state = await ensureStartedMatch(matchService, worldCupService);

  for (let step = 0; step < 220; step += 1) {
    if (state.isFinished) {
      state = await ensureStartedMatch(matchService, worldCupService);
      continue;
    }

    if (state.currentContext?.possession === MatchPossession.OPPONENT) {
      const defensiveOption = DEFENSIVE_ACTION_PRIORITY.map((action) => pickActionOption(state, action)).find(
        Boolean,
      );
      if (!defensiveOption) {
        const fallbackOption = pickProgressionOption(state);
        assert.ok(fallbackOption, 'defensive perspective: no option available');
        state = await matchService.play({
          selectedOption: fallbackOption.index,
          lang: 'en',
        });
        continue;
      }

      await executeAndAssertActorConsistency({
        matchService,
        previousState: state,
        selectedOptionIndex: defensiveOption.index,
        expectedTeamId: state.teamId,
        label: 'defensive perspective (user selected defensive action)',
      });
      return;
    }

    const progressionOption = pickProgressionOption(state);
    assert.ok(progressionOption, 'defensive perspective: no progression option available');
    state = await matchService.play({
      selectedOption: progressionOption.index,
      lang: 'en',
    });
  }

  assert.fail('defensive perspective: could not reach opponent-possession scenario within step budget.');
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const matchService = app.get(MatchService);
    const worldCupService = app.get(WorldCupService);

    await runActionContinuityScenario({
      targetAction: MatchAction.PASS,
      matchService,
      worldCupService,
    });

    await runActionContinuityScenario({
      targetAction: MatchAction.LONG_PASS,
      matchService,
      worldCupService,
    });

    await runDefensivePerspectiveScenario({
      matchService,
      worldCupService,
    });

    console.log(
      'OK - play integration continuity checks passed for PASS/LONG_PASS and defensive perspective.',
    );
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
