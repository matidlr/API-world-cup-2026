import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchTurnFlowHelper } from '../../src/match/helper/match-turn-flow.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';

type EffectiveTurnInput = {
  rawEventType: MatchEventType;
  possession: MatchPossession;
  zone: MatchFieldZone;
};

function run(): void {
  const helper = Object.create(MatchTurnFlowHelper.prototype) as any;
  helper['matchTurnInputHelper'] = {
    resolvePenaltyAwardedSide: (eventType: MatchEventType) =>
      eventType === MatchEventType.PENALTY_FOR_EVENT
        ? MatchPossession.USER
        : MatchPossession.OPPONENT,
  };
  helper['matchTurnOrchestratorHelper'] = {
    normalizePossessionForEvent: (eventType: MatchEventType, possession: MatchPossession) => {
      if (
        eventType === MatchEventType.PENALTY_FOR_EVENT ||
        eventType === MatchEventType.FREE_KICK_FOR_EVENT ||
        eventType === MatchEventType.CORNER_FOR_EVENT ||
        eventType === MatchEventType.THROW_IN_FOR_EVENT
      ) {
        return MatchPossession.USER;
      }

      if (
        eventType === MatchEventType.PENALTY_AGAINST_EVENT ||
        eventType === MatchEventType.FREE_KICK_AGAINST_EVENT ||
        eventType === MatchEventType.CORNER_AGAINST_EVENT ||
        eventType === MatchEventType.THROW_IN_AGAINST_EVENT
      ) {
        return MatchPossession.OPPONENT;
      }

      return possession;
    },
  };

  const resolveEffectiveTurnInput = helper['resolveEffectiveTurnInput'].bind(helper) as (params: any) => EffectiveTurnInput;

  {
    const result = resolveEffectiveTurnInput({
      isExecutingRegularPenalty: false,
      currentEventType: MatchEventType.BALL_POSSESSION_EVENT,
      selectedAction: MatchAction.PASS,
      currentStrategy: null,
      tacticalSnapshot: {},
      match: {
        eventType: MatchEventType.BALL_POSSESSION_EVENT,
        possessionTeam: MatchPossession.USER,
        currentZone: MatchFieldZone.ATTACK_THIRD,
      },
    });

    assert.equal(result.rawEventType, MatchEventType.BALL_POSSESSION_EVENT);
    assert.equal(result.possession, MatchPossession.USER);
    assert.equal(result.zone, MatchFieldZone.ATTACK_THIRD);
  }

  {
    const result = resolveEffectiveTurnInput({
      isExecutingRegularPenalty: false,
      currentEventType: MatchEventType.BALL_POSSESSION_EVENT,
      selectedAction: MatchAction.DRIBBLE,
      currentStrategy: null,
      tacticalSnapshot: {},
      match: {
        eventType: MatchEventType.BALL_POSSESSION_EVENT,
        possessionTeam: MatchPossession.OPPONENT,
        currentZone: MatchFieldZone.MIDFIELD,
      },
    });

    assert.equal(result.rawEventType, MatchEventType.BALL_POSSESSION_EVENT);
    assert.equal(
      result.possession,
      MatchPossession.OPPONENT,
      'Engine should keep persisted possession for current turn input.',
    );
    assert.equal(result.zone, MatchFieldZone.MIDFIELD);
  }

  {
    const result = resolveEffectiveTurnInput({
      isExecutingRegularPenalty: false,
      currentEventType: MatchEventType.KICKOFF_EVENT,
      selectedAction: MatchAction.SHOOT,
      currentStrategy: null,
      tacticalSnapshot: {},
      match: {
        eventType: MatchEventType.KICKOFF_EVENT,
        possessionTeam: MatchPossession.USER,
        currentZone: MatchFieldZone.BOX,
      },
    });

    assert.equal(result.rawEventType, MatchEventType.KICKOFF_EVENT);
    assert.equal(result.zone, MatchFieldZone.MIDFIELD, 'Zone should be normalized to allowed event zones.');
  }

  {
    const result = resolveEffectiveTurnInput({
      isExecutingRegularPenalty: true,
      currentEventType: MatchEventType.PENALTY_AGAINST_EVENT,
      selectedAction: MatchAction.SHOOT,
      currentStrategy: null,
      tacticalSnapshot: {},
      match: {
        eventType: MatchEventType.PENALTY_AGAINST_EVENT,
        possessionTeam: MatchPossession.USER,
        currentZone: MatchFieldZone.MIDFIELD,
      },
    });

    assert.equal(result.rawEventType, MatchEventType.PENALTY_AGAINST_EVENT);
    assert.equal(result.possession, MatchPossession.OPPONENT);
    assert.equal(result.zone, MatchFieldZone.BOX);
  }

  {
    const resolveActingPlayerFromMatchState = helper['resolveActingPlayerFromMatchState'].bind(helper);
    const resolved = resolveActingPlayerFromMatchState({
      match: {
        teamId: 'arg',
        opponentId: 'sui',
        ballCarrierTeamId: 'sui',
        ballCarrierName: 'Lautaro Martinez',
      },
      possession: MatchPossession.OPPONENT,
      userPlayers: [
        {
          playerId: 'u-1',
          name: 'Lautaro Martinez',
          position: 'FW',
          shirtNumber: 9,
          age: 28,
          skill: 88,
          attack: 91,
          defense: 42,
          energy: 83,
          isCaptain: false,
        },
      ],
      opponentPlayers: [
        {
          playerId: 'o-1',
          name: 'Edimilson Fernandes',
          position: 'MF',
          shirtNumber: 8,
          age: 30,
          skill: 78,
          attack: 74,
          defense: 76,
          energy: 80,
          isCaptain: false,
        },
      ],
    });

    assert.equal(
      resolved.name,
      'Edimilson Fernandes',
      'Acting player must stay coherent with possession side and never cross-pick rival roster by name.',
    );
  }

  console.log('OK - turn flow state alignment guardrails passed.');
}

run();
