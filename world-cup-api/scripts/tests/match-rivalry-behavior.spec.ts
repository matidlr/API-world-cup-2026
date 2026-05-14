import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { TeamsService } from '../../src/teams/teams.service';
import { MatchPlayTurnPipelineHelper } from '../../src/match/helper/match-play-turn-pipeline.helper';

type MatchMoraleState = {
  teamId: string;
  opponentId: string;
  teamMoraleBoostTurns: number;
  teamMoralePenaltyTurns: number;
  opponentMoraleBoostTurns: number;
  opponentMoralePenaltyTurns: number;
};

function buildMoraleMatch(teamId: string, opponentId: string): MatchMoraleState {
  return {
    teamId,
    opponentId,
    teamMoraleBoostTurns: 0,
    teamMoralePenaltyTurns: 0,
    opponentMoraleBoostTurns: 0,
    opponentMoralePenaltyTurns: 0,
  };
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const teamsService = app.get(TeamsService);

    const argentinaBrazil = await teamsService.areTeamsRivals('arg', 'bra');
    const argentinaJapan = await teamsService.areTeamsRivals('arg', 'jpn');

    assert.equal(
      argentinaBrazil,
      true,
      'Expected arg/bra to be rivals in seeded data.',
    );
    assert.equal(
      argentinaJapan,
      false,
      'Expected arg/jpn to be non-rivals in seeded data.',
    );

    const applyRivalryMoraleSwing = (
      MatchPlayTurnPipelineHelper.prototype as unknown as {
        applyRivalryMoraleSwing: (
          match: MatchMoraleState,
          scoringTeamId: string,
        ) => Promise<boolean>;
      }
    ).applyRivalryMoraleSwing;

    const rivalryMatch = buildMoraleMatch('arg', 'bra');
    const rivalryApplied = await applyRivalryMoraleSwing.call(
      { teamsService },
      rivalryMatch,
      'arg',
    );

    assert.equal(rivalryApplied, true, 'Expected morale swing on rivalry goal (arg/bra).');
    assert.equal(rivalryMatch.teamMoraleBoostTurns, 2, 'User side morale boost should be 2 turns.');
    assert.equal(
      rivalryMatch.opponentMoralePenaltyTurns,
      2,
      'Opponent side morale penalty should be 2 turns.',
    );

    const nonRivalMatch = buildMoraleMatch('arg', 'jpn');
    const nonRivalApplied = await applyRivalryMoraleSwing.call(
      { teamsService },
      nonRivalMatch,
      'arg',
    );

    assert.equal(nonRivalApplied, false, 'Expected no morale swing on non-rival goal (arg/jpn).');
    assert.equal(
      nonRivalMatch.teamMoraleBoostTurns,
      0,
      'Non-rival match must keep morale counters unchanged.',
    );
    assert.equal(nonRivalMatch.teamMoralePenaltyTurns, 0);
    assert.equal(nonRivalMatch.opponentMoraleBoostTurns, 0);
    assert.equal(nonRivalMatch.opponentMoralePenaltyTurns, 0);

    console.log('OK - rivalry pairs and morale swing behavior verified (arg/bra vs arg/jpn).');
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

