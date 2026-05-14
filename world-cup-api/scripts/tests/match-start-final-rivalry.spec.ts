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

function createStartFinalHelper(opponentTeamId: 'bra' | 'jpn'): MatchStartFinalHelper {
  const userPlayers = [buildPlayer('u1', 'Jugador A', 'MF'), buildPlayer('u2', 'Jugador B', 'FW')];
  const oppPlayers = [buildPlayer('o1', 'Rival A', 'DF'), buildPlayer('o2', 'Rival B', 'MF')];

  return new MatchStartFinalHelper(
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
      areTeamsRivals: async (teamId: string, otherTeamId: string) =>
        (teamId === 'arg' && otherTeamId === 'bra') || (teamId === 'bra' && otherTeamId === 'arg'),
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
          teamId: opponentTeamId,
          name: opponentTeamId === 'bra' ? 'Brazil' : 'Japan',
          captain: 'Capitán Rival',
          coach: 'DT Rival',
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
      buildStartMessages: (params: { isRivalryMatch?: boolean }) => ({
        en: params.isRivalryMatch
          ? ['HEADER EN', 'RIVALRY EN', 'KICKOFF EN']
          : ['HEADER EN', 'KICKOFF EN'],
        es: params.isRivalryMatch
          ? ['HEADER ES', 'RIVALIDAD ES', 'KICKOFF ES']
          : ['HEADER ES', 'KICKOFF ES'],
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
        opponentTeamId: opponentTeamId,
        opponentTeamName: opponentTeamId === 'bra' ? 'Brazil' : 'Japan',
        actingTeamId: 'arg',
        actingTeamName: 'Argentina',
        defendingTeamId: opponentTeamId,
        defendingTeamName: opponentTeamId === 'bra' ? 'Brazil' : 'Japan',
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
        isRivalryMatch: opponentTeamId === 'bra',
      }),
    } as any,
    {
      recordMatchTurnContext: async () => undefined,
      recordMatchStat: async () => undefined,
    } as any,
    {
      buildMatchResponse: (params: any) => ({
        messageItems: params.messageItems || [],
        currentContext: params.currentContext || null,
      }),
    } as any,
  );
}

async function run(): Promise<void> {
  const rivalryHelper = createStartFinalHelper('bra');
  const rivalryResponse = await rivalryHelper.startFinal({ teamId: 'arg', lang: 'es' });
  const rivalryTexts = rivalryResponse.messageItems.map((item: { text: string }) => item.text);

  assert.deepEqual(
    rivalryTexts,
    ['HEADER ES', 'RIVALIDAD ES', 'KICKOFF ES'],
    `Expected rivalry start message sequence for arg/bra. got=${JSON.stringify(rivalryTexts)}`,
  );

  const nonRivalHelper = createStartFinalHelper('jpn');
  const nonRivalResponse = await nonRivalHelper.startFinal({ teamId: 'arg', lang: 'es' });
  const nonRivalTexts = nonRivalResponse.messageItems.map((item: { text: string }) => item.text);

  assert.deepEqual(
    nonRivalTexts,
    ['HEADER ES', 'KICKOFF ES'],
    `Expected no rivalry start message for arg/jpn. got=${JSON.stringify(nonRivalTexts)}`,
  );

  console.log('OK - startFinal includes rivalry opener for arg/bra and skips it for arg/jpn.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
