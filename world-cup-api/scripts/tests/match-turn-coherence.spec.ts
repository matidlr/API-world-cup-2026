import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchContextBuilderHelper } from '../../src/match/helper/match-context-builder.helper';
import { MatchTurnOrchestratorHelper } from '../../src/match/helper/match-turn-orchestrator.helper';
import { MatchPlayerSelectionHelper } from '../../src/match/helper/match-player-selection.helper';
import { MatchRuntimeConfigHelper } from '../../src/match/helper/match-runtime-config.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

type MatchLike = {
  teamId: string;
  teamName: string;
  opponentId: string;
  opponentName: string;
  minute: number;
  turn: number;
  maxTurns: number;
  scoreTeam: number;
  scoreOpponent: number;
};

function player(
  id: string,
  name: string,
  position: TeamPlayer['position'],
  attack: number,
  defense: number,
): TeamPlayer {
  return {
    playerId: id,
    name,
    position,
    shirtNumber: 1,
    age: 27,
    skill: 80,
    attack,
    defense,
    energy: 85,
    isCaptain: false,
  };
}

function createMatch(): MatchLike {
  return {
    teamId: 'arg',
    teamName: 'Argentina',
    opponentId: 'irq',
    opponentName: 'Iraq',
    minute: 30,
    turn: 4,
    maxTurns: 10,
    scoreTeam: 0,
    scoreOpponent: 0,
  };
}

async function buildTurnSnapshot(params: {
  selectedAction: MatchAction;
  possession: MatchPossession;
  zone: MatchFieldZone;
  eventType: MatchEventType;
}) {
  const match = createMatch();
  const contextBuilder = new MatchContextBuilderHelper({
    areTeamsRivals: async () => false,
  } as any);
  const runtimeConfigHelper = new MatchRuntimeConfigHelper({ get: () => undefined } as any);
  const actionsByEvent = runtimeConfigHelper.loadActionsByEvent();
  const orchestrator = new MatchTurnOrchestratorHelper(new MatchPlayerSelectionHelper());

  const userPlayers: TeamPlayer[] = [
    player('arg_1', 'Nico Paz', 'MF', 84, 70),
    player('arg_2', 'Julian Alvarez', 'FW', 90, 55),
  ];
  const opponentPlayers: TeamPlayer[] = [
    player('irq_1', 'Ali Al-Hamadi', 'FW', 82, 60),
    player('irq_2', 'Rebin Sulaka', 'DF', 60, 85),
  ];

  const turnAdvance = orchestrator.buildTurnAdvance({
    match: match as any,
    selectedAction: params.selectedAction,
    rawEventType: params.eventType,
    possession: params.possession,
    zone: params.zone,
    userPlayers,
    baseUserPlayers: userPlayers,
    opponentPlayers,
    baseOpponentPlayers: opponentPlayers,
  });

  const availableActions = contextBuilder.getAvailableActions(
    params.eventType,
    params.zone,
    params.possession,
    actionsByEvent,
  );

  const currentContext = await contextBuilder.buildContext({
    match: match as any,
    eventType: params.eventType,
    zone: params.zone,
    possession: params.possession,
    actingPlayer: turnAdvance.turnContext.actingPlayer,
    availableActions,
    actionsByEvent,
    tacticalSnapshot: {
      teamStrategy: null,
      teamFormation: null,
      opponentStrategy: null,
      opponentFormation: null,
      teamPenaltyPoints: 0,
      opponentPenaltyPoints: 0,
      teamLine: { attack: 85, defense: 78, midfield: 82 },
      opponentLine: { attack: 80, defense: 79, midfield: 78 },
    },
    userPlayers,
    opponentPlayers,
    isPendingSetPiece: false,
    lastAction: params.selectedAction,
  });

  return {
    selectedAction: params.selectedAction,
    turnContext: turnAdvance.turnContext,
    currentContext,
  };
}

function assertUserActionCoherence(snapshot: {
  selectedAction: MatchAction;
  turnContext: { actingTeamId: string };
  currentContext: { userTeamId: string; availableActions: MatchAction[] };
}): void {
  assert.equal(
    snapshot.turnContext.actingTeamId,
    snapshot.currentContext.userTeamId,
    'Selected user action should be narrated by user team, not opponent.',
  );
  assert(
    snapshot.currentContext.availableActions.includes(snapshot.selectedAction),
    `Selected action ${snapshot.selectedAction} must exist in context.availableActions.`,
  );
}

async function run(): Promise<void> {
  {
    const coherent = await buildTurnSnapshot({
      selectedAction: MatchAction.PASS,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.ATTACK_THIRD,
      eventType: MatchEventType.BALL_POSSESSION_EVENT,
    });
    assertUserActionCoherence(coherent);
  }

  {
    // Regression guardrail:
    // if possession flips before action narration, user action can be assigned to opponent.
    const potentialBug = await buildTurnSnapshot({
      selectedAction: MatchAction.PRESS,
      possession: MatchPossession.OPPONENT,
      zone: MatchFieldZone.ATTACK_THIRD,
      eventType: MatchEventType.BALL_POSSESSION_EVENT,
    });
    assertUserActionCoherence(potentialBug);
  }

  console.log('OK - turn coherence guardrails passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
