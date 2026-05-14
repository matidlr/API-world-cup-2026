import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';
import { MatchCurrentContext } from '../../src/match/interfaces/match-current-context.interface';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(overrides: Partial<TeamPlayer> = {}): TeamPlayer {
  return {
    playerId: 'p-1',
    name: 'Player One',
    position: 'MF',
    shirtNumber: 8,
    age: 26,
    skill: 80,
    attack: 78,
    defense: 72,
    energy: 84,
    isCaptain: false,
    ...overrides,
  };
}

function sampleContext(): MatchCurrentContext {
  const acting = player();
  const teammate = player({ playerId: 'p-2', name: 'Player Two', position: 'FW' });
  const opponent = player({ playerId: 'o-1', name: 'Opponent One', position: 'DF' });

  return {
    matchId: 'final_001',
    turn: 4,
    minute: 37,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    zone: MatchFieldZone.ATTACK_THIRD,
    possession: MatchPossession.USER,
    userTeamId: 'arg',
    userTeamName: 'Argentina',
    opponentTeamId: 'fra',
    opponentTeamName: 'France',
    actingTeamId: 'arg',
    actingTeamName: 'Argentina',
    defendingTeamId: 'fra',
    defendingTeamName: 'France',
    actingPlayer: acting,
    teammatesInZone: [acting, teammate],
    opponentsInZone: [opponent],
    actingOnFieldCount: 11,
    defendingOnFieldCount: 11,
    tacticalSnapshot: {
      teamStrategy: null,
      teamFormation: null,
      opponentStrategy: null,
      opponentFormation: null,
      teamPenaltyPoints: 0,
      opponentPenaltyPoints: 0,
      teamLine: { attack: 86, defense: 80, midfield: 84 },
      opponentLine: { attack: 84, defense: 82, midfield: 83 },
    },
    availableActions: [MatchAction.PASS, MatchAction.DRIBBLE, MatchAction.SHOOT],
    isPendingSetPiece: false,
    isRivalryMatch: true,
    lastAction: MatchAction.PASS,
    lastOutcome: 'Argentina keeps pushing in attack third.',
  };
}

async function run(): Promise<void> {
  const pipeline = Object.create(MatchPlayTurnPipelineHelper.prototype) as any;

  const persistedCalls: any[] = [];
  pipeline.matchPersistenceHelper = {
    recordMatchTurnContext: async (payload: any) => {
      persistedCalls.push(payload);
    },
  };
  pipeline.matchNarrativeVariantHelper = {
    resolveTurnResultKey: (
      _action: MatchAction | null,
      _outcome: MatchActionOutcome | undefined,
      _success: boolean,
      _fallback: string,
    ) => 'match.turn.result.outcome.PASS_SUCCESS_PROGRESS.3',
  };

  const context = sampleContext();
  await pipeline['recordMatchTurnContext']({
    matchId: context.matchId,
    turn: context.turn,
    minute: context.minute,
    phase: 'TURN',
    selectedAction: MatchAction.PASS,
    actionOutcome: MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    headline: context.lastOutcome,
    context,
  });

  assert.equal(persistedCalls.length, 1);
  const payload = persistedCalls[0];
  assert.equal(payload.matchId, 'final_001');
  assert.equal(payload.turn, 4);
  assert.equal(payload.minute, 37);
  assert.equal(payload.phase, 'TURN');
  assert.equal(payload.selectedAction, MatchAction.PASS);
  assert.equal(payload.actionOutcome, MatchActionOutcome.PASS_SUCCESS_PROGRESS);
  assert.equal(payload.headline, context.lastOutcome);
  assert.equal(payload.context.eventType, MatchEventType.BALL_POSSESSION_EVENT);
  assert.equal(payload.context.zone, MatchFieldZone.ATTACK_THIRD);
  assert.equal(payload.context.possession, MatchPossession.USER);
  assert.deepEqual(payload.context, context);

  const resultKey = pipeline['resolveTurnResultKey'](
    MatchAction.PASS,
    MatchActionOutcome.PASS_SUCCESS_PROGRESS,
    true,
    'match.turn.userNoFinish',
  );
  assert.equal(resultKey, 'match.turn.result.outcome.PASS_SUCCESS_PROGRESS.3');

  console.log('OK - turn context persistence + outcome-key preference passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
