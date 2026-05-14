import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchContextBuilderHelper } from '../../src/match/helper/match-context-builder.helper';
import { MatchFormation } from '../../src/match/model/match-formation.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function createPlayer(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p',
    name: 'Player',
    position: 'MF',
    shirtNumber: 8,
    age: 25,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 80,
    isCaptain: false,
    ...overrides,
  };
}

function createRoster(): TeamPlayer[] {
  return [
    createPlayer({ playerId: 'gk-1', name: 'GK 1', position: 'GK', skill: 79, defense: 86 }),
    createPlayer({ playerId: 'df-1', name: 'DF 1', position: 'DF', skill: 80, defense: 84 }),
    createPlayer({ playerId: 'df-2', name: 'DF 2', position: 'DF', skill: 78, defense: 83 }),
    createPlayer({ playerId: 'df-3', name: 'DF 3', position: 'DF', skill: 77, defense: 82 }),
    createPlayer({ playerId: 'df-4', name: 'DF 4', position: 'DF', skill: 76, defense: 81 }),
    createPlayer({ playerId: 'mf-1', name: 'MF 1', position: 'MF', skill: 81, attack: 80 }),
    createPlayer({ playerId: 'mf-2', name: 'MF 2', position: 'MF', skill: 80, attack: 81 }),
    createPlayer({ playerId: 'mf-3', name: 'MF 3', position: 'MF', skill: 79, attack: 82 }),
    createPlayer({ playerId: 'mf-4', name: 'MF 4', position: 'MF', skill: 78, attack: 83 }),
    createPlayer({ playerId: 'fw-1', name: 'FW 1', position: 'FW', skill: 81, attack: 86 }),
    createPlayer({ playerId: 'fw-2', name: 'FW 2', position: 'FW', skill: 80, attack: 85 }),
    createPlayer({ playerId: 'fw-3', name: 'FW 3', position: 'FW', skill: 79, attack: 84 }),
  ];
}

function createFlatMidfieldRoster(): TeamPlayer[] {
  return [
    createPlayer({ playerId: 'mf-a', name: 'MF A', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'mf-b', name: 'MF B', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'mf-c', name: 'MF C', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'mf-d', name: 'MF D', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'mf-e', name: 'MF E', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'mf-f', name: 'MF F', position: 'MF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'df-a', name: 'DF A', position: 'DF', skill: 80, attack: 80, defense: 80 }),
    createPlayer({ playerId: 'fw-a', name: 'FW A', position: 'FW', skill: 80, attack: 80, defense: 80 }),
  ];
}

function runZonePoolVarietyCheck(helper: MatchContextBuilderHelper): void {
  const roster = createRoster();
  const signatures = new Set<string>();

  for (let i = 0; i < 220; i += 1) {
    const selection = helper.getPlayersByZone(roster, MatchFieldZone.MIDFIELD, true, {
      formation: MatchFormation.F_4_4_2,
      recentActorId: 'mf-1',
    });
    signatures.add(selection.map((player) => player.playerId).sort().join('|'));
  }

  assert.ok(signatures.size >= 3, `Expected at least 3 distinct midfield pools. Got ${signatures.size}.`);
}

function runFormationBiasCheck(helper: MatchContextBuilderHelper): void {
  const roster = createRoster();
  let fwSelectionsIn433 = 0;
  let totalSelectionsIn433 = 0;
  let fwSelectionsIn541 = 0;
  let totalSelectionsIn541 = 0;

  for (let i = 0; i < 300; i += 1) {
    const aggressive = helper.getPlayersByZone(roster, MatchFieldZone.ATTACK_THIRD, true, {
      formation: MatchFormation.F_4_3_3,
    });
    fwSelectionsIn433 += aggressive.filter((player) => player.position === 'FW').length;
    totalSelectionsIn433 += aggressive.length;

    const defensive = helper.getPlayersByZone(roster, MatchFieldZone.ATTACK_THIRD, true, {
      formation: MatchFormation.F_5_4_1,
    });
    fwSelectionsIn541 += defensive.filter((player) => player.position === 'FW').length;
    totalSelectionsIn541 += defensive.length;
  }

  const aggressiveFwRatio = fwSelectionsIn433 / Math.max(1, totalSelectionsIn433);
  const defensiveFwRatio = fwSelectionsIn541 / Math.max(1, totalSelectionsIn541);
  assert.ok(
    aggressiveFwRatio > defensiveFwRatio,
    `Expected higher FW ratio for 4-3-3 than 5-4-1. Got ${aggressiveFwRatio.toFixed(3)} vs ${defensiveFwRatio.toFixed(3)}.`,
  );
}

function runAntiRepetitionCheck(helper: MatchContextBuilderHelper): void {
  const roster = createFlatMidfieldRoster();
  const recentActorId = 'mf-a';
  const counters = new Map<string, number>();
  roster.forEach((player) => counters.set(player.playerId, 0));

  for (let i = 0; i < 450; i += 1) {
    const selection = helper.getPlayersByZone(roster, MatchFieldZone.MIDFIELD, true, {
      formation: MatchFormation.F_4_3_3,
      recentActorId,
    });
    for (const player of selection) {
      counters.set(player.playerId, (counters.get(player.playerId) || 0) + 1);
    }
  }

  const repeatedCount = counters.get(recentActorId) || 0;
  const neutralCounts = Array.from(counters.entries())
    .filter(([id]) => id !== recentActorId)
    .map(([, count]) => count)
    .sort((a, b) => a - b);
  const medianNeutral = neutralCounts[Math.floor(neutralCounts.length / 2)] || 0;

  assert.ok(
    repeatedCount < medianNeutral,
    `Expected recent actor to appear less often. Got repeated=${repeatedCount}, neutralMedian=${medianNeutral}.`,
  );
}

function runSelectionSafetyCheck(helper: MatchContextBuilderHelper): void {
  const roster = createRoster();
  const selection = helper.getPlayersByZone(roster, MatchFieldZone.BOX, true, {
    formation: MatchFormation.F_4_3_3,
    recentActorId: 'fw-1',
  });

  const ids = selection.map((player) => player.playerId);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'Zone pool should not contain duplicated players.');
  assert.ok(
    selection.every((player) => roster.some((candidate) => candidate.playerId === player.playerId)),
    'All zone pool players must belong to the source roster.',
  );
}

function run(): void {
  const helper = new MatchContextBuilderHelper({} as any);
  runZonePoolVarietyCheck(helper);
  runFormationBiasCheck(helper);
  runAntiRepetitionCheck(helper);
  runSelectionSafetyCheck(helper);
  console.log('OK - zone pool variation checks passed.');
}

run();
