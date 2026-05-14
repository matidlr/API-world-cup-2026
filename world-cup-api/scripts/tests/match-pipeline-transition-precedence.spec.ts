import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchActionOutcome } from '../../src/match/model/match-action-outcome.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { MatchActionOutcomeResult } from '../../src/match/interfaces/match-action-outcome.interface';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function createPlayer(id: string, name: string, position: TeamPlayer['position']): TeamPlayer {
  return {
    playerId: id,
    name,
    position,
    shirtNumber: 1,
    age: 27,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 90,
    isCaptain: false,
  };
}

function createOutcome(overrides: Partial<MatchActionOutcomeResult>): MatchActionOutcomeResult {
  return {
    scoreTeam: 0,
    scoreOpponent: 0,
    message: 'ok',
    isGoal: false,
    goalMessageKey: null,
    statTeamId: 'arg',
    statTeamName: 'Argentina',
    statPlayerName: 'Lautaro Martinez',
    statPlayerPosition: 'FW',
    statAction: MatchAction.TACKLE,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Lautaro Martinez',
    actingPlayer: createPlayer('u-1', 'Lautaro Martinez', 'FW'),
    incidents: [],
    actionOutcome: MatchActionOutcome.NOT_HANDLED,
    nextZone: MatchFieldZone.MIDFIELD,
    nextPossession: MatchPossession.USER,
    nextEventType: MatchEventType.BALL_POSSESSION_EVENT,
    ...overrides,
  };
}

function run(): void {
  const helper = Object.create(MatchPlayTurnPipelineHelper.prototype) as any;

  helper.matchPlayerSelectionHelper = {
    pickPlayerForAction: (players: TeamPlayer[]) => players[0],
  };

  const userPlayers = [createPlayer('u-1', 'Lautaro Martinez', 'FW')];
  const opponentPlayers = [createPlayer('o-1', 'Edimilson Fernandes', 'MF')];
  const baseUserPlayers = userPlayers;
  const baseOpponentPlayers = opponentPlayers;

  const match = {
    teamId: 'arg',
    opponentId: 'sui',
    possessionTeam: MatchPossession.OPPONENT,
    currentZone: MatchFieldZone.MIDFIELD,
    eventType: MatchEventType.DEFENSE_EVENT,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Lautaro Martinez',
  } as any;

  const turnOutcome = createOutcome({
    actionOutcome: MatchActionOutcome.NOT_HANDLED,
    nextPossession: MatchPossession.USER,
    nextZone: MatchFieldZone.MIDFIELD,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Lautaro Martinez',
  });

  helper['applyOutcomeTransition']({
    match,
    turnOutcome,
    userPlayers,
    baseUserPlayers,
    opponentPlayers,
    baseOpponentPlayers,
  });

  assert.equal(
    match.possessionTeam,
    MatchPossession.USER,
    'Runtime transition should preserve nextPossession when carrier side matches outcome side.',
  );
  assert.equal(
    match.eventType,
    MatchEventType.BALL_POSSESSION_EVENT,
    'Runtime transition should use nextEventType provided by outcome.',
  );
  assert.equal(match.ballCarrierTeamId, 'arg', 'Ball carrier team must align with resulting possession side.');
  assert.equal(match.ballCarrierName, 'Lautaro Martinez');

  const mismatchPossessionMatch = {
    teamId: 'arg',
    opponentId: 'sui',
    possessionTeam: MatchPossession.USER,
    currentZone: MatchFieldZone.MIDFIELD,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Old Carrier',
  } as any;

  const mismatchPossessionOutcome = createOutcome({
    nextPossession: MatchPossession.USER,
    ballCarrierTeamId: 'sui',
    ballCarrierName: 'Edimilson Fernandes',
    actingPlayer: opponentPlayers[0],
  });

  helper['applyOutcomeTransition']({
    match: mismatchPossessionMatch,
    turnOutcome: mismatchPossessionOutcome,
    userPlayers,
    baseUserPlayers,
    opponentPlayers,
    baseOpponentPlayers,
  });

  assert.equal(
    mismatchPossessionMatch.possessionTeam,
    MatchPossession.USER,
    'Runtime transition must keep nextPossession as the single source of truth.',
  );
  assert.equal(
    mismatchPossessionMatch.ballCarrierTeamId,
    'arg',
    'Carrier team must be normalized to the resulting possession side.',
  );
  assert.equal(
    mismatchPossessionMatch.ballCarrierName,
    'Lautaro Martinez',
    'When outcome carrier side diverges from nextPossession, carrier must fallback to the resulting side roster.',
  );

  const sameTeamCarrierMatch = {
    teamId: 'arg',
    opponentId: 'sui',
    possessionTeam: MatchPossession.USER,
    currentZone: MatchFieldZone.MIDFIELD,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Old Carrier',
  } as any;

  const sameTeamCarrierOutcome = createOutcome({
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Lautaro Martinez',
    actingPlayer: userPlayers[0],
    nextPossession: MatchPossession.USER,
  });

  helper['applyOutcomeTransition']({
    match: sameTeamCarrierMatch,
    turnOutcome: sameTeamCarrierOutcome,
    userPlayers,
    baseUserPlayers,
    opponentPlayers,
    baseOpponentPlayers,
  });

  assert.equal(
    sameTeamCarrierMatch.ballCarrierName,
    'Lautaro Martinez',
    'Carrier must be synchronized from outcome even when possession side does not change.',
  );

  const fallbackCarrierMatch = {
    teamId: 'arg',
    opponentId: 'sui',
    possessionTeam: MatchPossession.USER,
    currentZone: MatchFieldZone.MIDFIELD,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Old Carrier',
  } as any;

  const fallbackCarrierOutcome = createOutcome({
    ballCarrierTeamId: 'arg',
    ballCarrierName: 'Unknown Player',
    actingPlayer: userPlayers[0],
    nextPossession: MatchPossession.USER,
  });

  helper['applyOutcomeTransition']({
    match: fallbackCarrierMatch,
    turnOutcome: fallbackCarrierOutcome,
    userPlayers,
    baseUserPlayers,
    opponentPlayers,
    baseOpponentPlayers,
  });

  assert.equal(
    fallbackCarrierMatch.ballCarrierName,
    userPlayers[0].name,
    'When outcome carrier is invalid, fallback acting player must become the carrier.',
  );

  const invalidNameCrossSideMatch = {
    teamId: 'arg',
    opponentId: 'sui',
    possessionTeam: MatchPossession.OPPONENT,
    currentZone: MatchFieldZone.MIDFIELD,
    eventType: MatchEventType.DEFENSE_EVENT,
    ballCarrierTeamId: 'sui',
    ballCarrierName: 'Old Rival Carrier',
  } as any;

  const invalidNameCrossSideOutcome = createOutcome({
    nextPossession: MatchPossession.OPPONENT,
    ballCarrierTeamId: 'sui',
    ballCarrierName: 'Lautaro Martinez',
    actingPlayer: userPlayers[0],
  });

  helper['applyOutcomeTransition']({
    match: invalidNameCrossSideMatch,
    turnOutcome: invalidNameCrossSideOutcome,
    userPlayers,
    baseUserPlayers,
    opponentPlayers,
    baseOpponentPlayers,
  });

  assert.equal(
    invalidNameCrossSideMatch.possessionTeam,
    MatchPossession.OPPONENT,
    'Possession must remain on resolved opponent side.',
  );
  assert.equal(
    invalidNameCrossSideMatch.ballCarrierTeamId,
    'sui',
    'Carrier team must match possession side.',
  );
  assert.equal(
    invalidNameCrossSideMatch.ballCarrierName,
    opponentPlayers[0].name,
    'Carrier name must be normalized to the opponent roster when provided name is cross-side.',
  );

  console.log('OK - pipeline transition precedence guardrail passed.');
}

run();
