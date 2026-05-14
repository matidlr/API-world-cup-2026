import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchStartFinalHelper } from '../../src/match/helper/match-start-final.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchEventType } from '../../src/match/model/match-event-type.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { MatchFormation } from '../../src/match/model/match-formation.enum';
import { MatchPossession } from '../../src/match/model/match-possession.enum';
import { MatchStrategy } from '../../src/match/model/match-strategy.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function buildPlayer(playerId: string, name: string, position: TeamPlayer['position']): TeamPlayer {
  return {
    playerId,
    name,
    position,
    shirtNumber: 1,
    age: 26,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 90,
    isCaptain: false,
  };
}

async function run(): Promise<void> {
  let contextHeadline = '';
  let kickoffStatMessage = '';

  const userPlayers = [buildPlayer('u1', 'Jugador A', 'MF'), buildPlayer('u2', 'Jugador B', 'FW')];
  const oppPlayers = [buildPlayer('o1', 'Rival A', 'DF'), buildPlayer('o2', 'Rival B', 'MF')];

  const helper = new MatchStartFinalHelper(
    {
      findOne: async () => null,
      create: (entity: any) => entity,
      save: async (entity: any) => entity,
    } as any,
    {
      getTeamPlayers: async (teamId: string) => (teamId === 'arg' ? userPlayers : oppPlayers),
      getTeamCoachIdentity: async (teamId: string) => ({
        name: teamId === 'arg' ? 'DT Argentina' : 'DT Rival',
        profile: null,
      }),
      areTeamsRivals: async () => false,
    } as any,
    {
      ensureReadyFinalForTeam: async () => ({
        selectedTeam: {
          teamId: 'arg',
          name: 'Argentina',
          captain: 'Capitán Arg',
          coach: 'DT Argentina',
          strategy: MatchStrategy.POSSESSION,
          formation: MatchFormation.F_4_3_3,
        },
        opponent: {
          teamId: 'fra',
          name: 'France',
          captain: 'Capitán Fra',
          coach: 'DT France',
          strategy: MatchStrategy.ATTACK,
          formation: MatchFormation.F_4_3_3,
        },
      }),
      markFinalActive: async () => undefined,
    } as any,
    {
      resolveLanguage: (value: string) => (value === 'es' ? 'es' : 'en'),
      loadActionsByEvent: () => ({
        [MatchEventType.KICKOFF_EVENT]: [MatchAction.PASS],
      }),
      loadMaxTurnsPerMatch: () => 10,
      loadMaxSubstitutionsPerTeam: () => 5,
    } as any,
    {
      buildOptions: () => [{ index: 1, action: MatchAction.PASS, label: 'Pasar' }],
    } as any,
    {
      initializeMatchSquad: async () => undefined,
      getMatchOnFieldPlayers: async (matchId: string, teamId: string) =>
        teamId === 'arg' ? userPlayers : oppPlayers,
    } as any,
    {
      pickPlayerForAction: (players: TeamPlayer[]) => players[0],
    } as any,
    {
      buildStartMessages: () => ({
        en: ['World Cup final started: Argentina vs France.', 'Player starts from midfield.'],
        es: ['Comenzo la final del Mundial: Argentina vs France.', 'Jugador inicia el partido desde el mediocampo.'],
      }),
      pickMessagesByLanguage: (bundle: { en: string[]; es: string[] }, language: 'en' | 'es') =>
        language === 'es' ? bundle.es : bundle.en,
    } as any,
    {
      parseStrategy: (value: string | null) => value,
      parseFormation: (value: string | null) => value,
      buildTacticalSnapshot: () => ({
        teamStrategy: MatchStrategy.POSSESSION,
        teamFormation: MatchFormation.F_4_3_3,
        opponentStrategy: MatchStrategy.ATTACK,
        opponentFormation: MatchFormation.F_4_3_3,
        teamPenaltyPoints: 0,
        opponentPenaltyPoints: 0,
        teamLine: { attack: 80, defense: 80, midfield: 80 },
        opponentLine: { attack: 80, defense: 80, midfield: 80 },
      }),
    } as any,
    {
      buildContext: async () => ({
        matchId: 'm1',
        turn: 1,
        minute: 1,
        eventType: MatchEventType.KICKOFF_EVENT,
        zone: MatchFieldZone.MIDFIELD,
        possession: MatchPossession.USER,
        userTeamId: 'arg',
        userTeamName: 'Argentina',
        opponentTeamId: 'fra',
        opponentTeamName: 'France',
        actingTeamId: 'arg',
        actingTeamName: 'Argentina',
        defendingTeamId: 'fra',
        defendingTeamName: 'France',
        actingPlayer: userPlayers[0],
        teammatesInZone: userPlayers,
        opponentsInZone: oppPlayers,
        actingOnFieldCount: 11,
        defendingOnFieldCount: 11,
        tacticalSnapshot: {
          teamStrategy: MatchStrategy.POSSESSION,
          teamFormation: MatchFormation.F_4_3_3,
          opponentStrategy: MatchStrategy.ATTACK,
          opponentFormation: MatchFormation.F_4_3_3,
          teamPenaltyPoints: 0,
          opponentPenaltyPoints: 0,
          teamLine: { attack: 80, defense: 80, midfield: 80 },
          opponentLine: { attack: 80, defense: 80, midfield: 80 },
        },
        availableActions: [MatchAction.PASS],
        isPendingSetPiece: false,
        isRivalryMatch: false,
      }),
    } as any,
    {
      recordMatchTurnContext: async (payload: { headline: string }) => {
        contextHeadline = payload.headline;
      },
      recordMatchStat: async (payload: { message: string }) => {
        kickoffStatMessage = payload.message;
      },
    } as any,
    {
      buildMatchResponse: (params: any) => ({
        matchId: params.match.matchId,
        teamId: params.match.teamId,
        opponentId: params.match.opponentId,
        teamName: params.match.teamName,
        opponentName: params.match.opponentName,
        messageItems: params.messageItems || [],
        score: `${params.match.scoreTeam}-${params.match.scoreOpponent}`,
        minute: params.match.minute,
        turn: params.match.turn,
        zone: params.match.currentZone,
        possession: params.match.possessionTeam,
        ballCarrier: params.match.ballCarrierName,
        teamStrategy: params.match.strategy,
        teamFormation: params.match.formation,
        teamCoachName: 'DT Argentina',
        teamCoachProfile: null,
        opponentStrategy: params.match.opponentStrategy,
        opponentFormation: params.match.opponentFormation,
        opponentCoachName: 'DT France',
        opponentCoachProfile: null,
        eventType: params.match.eventType,
        options: [],
        isFinished: false,
        result: null,
        currentContext: params.currentContext || null,
      }),
    } as any,
  );

  const response = await helper.startFinal({ teamId: 'arg', lang: 'es' });

  assert.equal(
    contextHeadline,
    'Comenzo la final del Mundial: Argentina vs France.',
    `Expected turn context headline in ES. got=${contextHeadline}`,
  );
  assert.equal(
    kickoffStatMessage,
    'Jugador inicia el partido desde el mediocampo.',
    `Expected kickoff stat message in ES. got=${kickoffStatMessage}`,
  );
  assert.ok(
    response.messageItems.every((item: any) => !String(item.text).includes('World Cup final started')),
    `Expected no EN kickoff headline in ES response. items=${JSON.stringify(response.messageItems, null, 2)}`,
  );

  console.log('OK - start final persists and returns localized kickoff messages.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
