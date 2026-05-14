import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchTurnFlowHelper } from '../../src/match/helper/match-turn-flow.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
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

function createHelperHarness(): any {
  const helper = Object.create(MatchTurnFlowHelper.prototype) as any;
  helper.actionsByEvent = {
    [MatchEventType.BALL_POSSESSION_EVENT]: [
      MatchAction.PASS,
      MatchAction.DRIBBLE,
      MatchAction.SHOOT,
    ],
  };
  helper.matchContextBuilderHelper = {
    buildContext: async (params: any) => params,
  };
  return helper;
}

async function run(): Promise<void> {
  const helper = createHelperHarness();
  const buildResponseContext = helper['buildResponseContext'].bind(helper);

  const userCarrier = player({ playerId: 'u-9', name: 'Lautaro Martinez', position: 'FW' });
  const opponent = player({ playerId: 'o-1', name: 'Opponent One', position: 'DF' });

  const baseMatch = {
    matchId: 'm-1',
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'sui',
    opponentName: 'Switzerland',
    turn: 3,
    minute: 17,
    eventType: MatchEventType.BALL_POSSESSION_EVENT,
    currentZone: MatchFieldZone.MIDFIELD,
  } as any;

  {
    const match = {
      ...baseMatch,
      possessionTeam: MatchPossession.OPPONENT,
      ballCarrierTeamId: 'arg',
      ballCarrierName: 'Lautaro Martinez',
    } as any;

    const context = await buildResponseContext({
      match,
      tacticalSnapshot: {
        teamStrategy: null,
        teamFormation: null,
        opponentStrategy: null,
        opponentFormation: null,
        teamPenaltyPoints: 0,
        opponentPenaltyPoints: 0,
        teamLine: { attack: 85, defense: 79, midfield: 83 },
        opponentLine: { attack: 82, defense: 80, midfield: 81 },
      },
      userPlayers: [userCarrier],
      opponentPlayers: [opponent],
      options: [{ index: 1, action: MatchAction.PASS, label: 'Pass' }],
      lastAction: MatchAction.PASS,
      lastOutcome: 'ok',
      isPendingSetPiece: false,
    });

    assert.equal(
      context.possession,
      MatchPossession.USER,
      'Context possession must align with ballCarrierTeamId when persisted possession diverges.',
    );
    assert.equal(
      context.actingPlayer.name,
      'Lautaro Martinez',
      'Context actingPlayer must align with resolved ball carrier.',
    );
    assert.equal(
      match.possessionTeam,
      MatchPossession.USER,
      'Match possession should be normalized to carrier side for response context consistency.',
    );
  }

  {
    const match = {
      ...baseMatch,
      possessionTeam: MatchPossession.USER,
      ballCarrierTeamId: 'arg',
      ballCarrierName: 'Ghost Carrier',
    } as any;

    const context = await buildResponseContext({
      match,
      tacticalSnapshot: {
        teamStrategy: null,
        teamFormation: null,
        opponentStrategy: null,
        opponentFormation: null,
        teamPenaltyPoints: 0,
        opponentPenaltyPoints: 0,
        teamLine: { attack: 85, defense: 79, midfield: 83 },
        opponentLine: { attack: 82, defense: 80, midfield: 81 },
      },
      userPlayers: [userCarrier],
      opponentPlayers: [opponent],
      options: [{ index: 1, action: MatchAction.PASS, label: 'Pass' }],
      lastAction: MatchAction.PASS,
      lastOutcome: 'ok',
      isPendingSetPiece: false,
    });

    assert.equal(
      context.actingPlayer.name,
      'Ghost Carrier',
      'When carrier is missing from roster, context must still preserve carrier identity.',
    );
  }

  console.log('OK - response context carrier alignment guardrails passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

