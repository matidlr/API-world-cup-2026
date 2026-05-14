import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { MatchContextBuilderHelper } from '../../src/match/helper/match-context-builder.helper';
import { MatchPlayerSelectionHelper } from '../../src/match/helper/match-player-selection.helper';
import { MatchAction } from '../../src/match/model/match-action.enum';
import { MatchFieldZone } from '../../src/match/model/match-field-zone.enum';
import { TeamPlayer } from '../../src/teams/model/team-player.model';

function player(overrides: Partial<TeamPlayer>): TeamPlayer {
  return {
    playerId: 'p',
    name: 'Player',
    position: 'MF',
    shirtNumber: 8,
    age: 27,
    skill: 80,
    attack: 80,
    defense: 80,
    energy: 80,
    isCaptain: false,
    ...overrides,
  };
}

function createBalancedRoster(): TeamPlayer[] {
  return [
    player({ playerId: 'gk', name: 'GK', position: 'GK' }),
    player({ playerId: 'df', name: 'DF', position: 'DF' }),
    player({ playerId: 'mf', name: 'MF', position: 'MF' }),
    player({ playerId: 'fw', name: 'FW', position: 'FW' }),
  ];
}

function runPassZoneRoleChecks(): void {
  const helper = new MatchPlayerSelectionHelper();
  const roster = createBalancedRoster();

  const defensePass = helper.pickPlayerForAction(roster, MatchAction.PASS, MatchFieldZone.DEFENSE_THIRD);
  assert.equal(defensePass.position, 'DF', 'Pass from defensive third should prioritize DF receivers.');

  const midfieldPass = helper.pickPlayerForAction(roster, MatchAction.PASS, MatchFieldZone.MIDFIELD);
  assert.equal(midfieldPass.position, 'MF', 'Pass from midfield should prioritize MF receivers.');

  const attackPass = helper.pickPlayerForAction(roster, MatchAction.PASS, MatchFieldZone.ATTACK_THIRD);
  assert.ok(
    attackPass.position === 'FW' || attackPass.position === 'MF',
    `Pass from attacking third should prioritize FW/MF. Got ${attackPass.position}`,
  );

  const boxPass = helper.pickPlayerForAction(roster, MatchAction.PASS, MatchFieldZone.BOX);
  assert.ok(
    boxPass.position === 'FW' || boxPass.position === 'MF',
    `Pass in box should prioritize FW/MF. Got ${boxPass.position}`,
  );
}

function runLongPassZoneRoleChecks(): void {
  const helper = new MatchPlayerSelectionHelper();
  const roster = createBalancedRoster();

  const defenseLongPass = helper.pickPlayerForAction(roster, MatchAction.LONG_PASS, MatchFieldZone.DEFENSE_THIRD);
  assert.equal(
    defenseLongPass.position,
    'DF',
    'Long pass from defensive third should originate from a defensive profile.',
  );

  const midfieldLongPass = helper.pickPlayerForAction(roster, MatchAction.LONG_PASS, MatchFieldZone.MIDFIELD);
  assert.equal(
    midfieldLongPass.position,
    'MF',
    'Long pass from midfield should prioritize MF profile.',
  );

  const attackLongPass = helper.pickPlayerForAction(roster, MatchAction.LONG_PASS, MatchFieldZone.ATTACK_THIRD);
  assert.ok(
    attackLongPass.position === 'FW' || attackLongPass.position === 'MF',
    `Long pass in attacking third should prioritize FW/MF. Got ${attackLongPass.position}`,
  );
}

function runCornerReceiverShouldNotBeGoalkeeperWhenAlternativesExist(): void {
  const helper = new MatchPlayerSelectionHelper();

  const rosterWithAlternatives = [
    player({ playerId: 'gk', name: 'GK', position: 'GK' }),
    player({ playerId: 'df', name: 'DF', position: 'DF' }),
    player({ playerId: 'mf', name: 'MF', position: 'MF' }),
  ];

  const cornerReceiver = helper.pickPlayerForAction(
    rosterWithAlternatives,
    MatchAction.PASS,
    MatchFieldZone.BOX,
  );

  assert.notEqual(
    cornerReceiver.position,
    'GK',
    'Corner-like continuation in box should not select GK when field-player alternatives exist.',
  );
}

function runContextBoxActingTeamSelectionChecks(): void {
  const contextBuilder = Object.create(MatchContextBuilderHelper.prototype) as MatchContextBuilderHelper;
  const balancedRoster = [
    player({ playerId: 'gk', name: 'GK', position: 'GK' }),
    player({ playerId: 'df-1', name: 'DF 1', position: 'DF' }),
    player({ playerId: 'df-2', name: 'DF 2', position: 'DF' }),
    player({ playerId: 'mf-1', name: 'MF 1', position: 'MF' }),
    player({ playerId: 'mf-2', name: 'MF 2', position: 'MF' }),
    player({ playerId: 'fw-1', name: 'FW 1', position: 'FW' }),
    player({ playerId: 'fw-2', name: 'FW 2', position: 'FW' }),
  ];

  const attackingBox = contextBuilder.getPlayersByZone(
    balancedRoster,
    MatchFieldZone.BOX,
    true,
  );
  assert.ok(attackingBox.length > 0, 'Acting-team box pool should not be empty.');
  assert.ok(
    attackingBox.every((playerItem) => playerItem.position === 'FW' || playerItem.position === 'MF'),
    `Acting-team box pool should prioritize FW/MF when available. Got: ${attackingBox
      .map((playerItem) => playerItem.position)
      .join(', ')}`,
  );

  const noAttackersRoster = [
    player({ playerId: 'gk-only', name: 'GK', position: 'GK' }),
    player({ playerId: 'df-only-1', name: 'DF 1', position: 'DF' }),
    player({ playerId: 'df-only-2', name: 'DF 2', position: 'DF' }),
  ];
  const fallbackBox = contextBuilder.getPlayersByZone(
    noAttackersRoster,
    MatchFieldZone.BOX,
    true,
  );
  assert.ok(fallbackBox.length > 0, 'Fallback acting-team box pool should not be empty.');
  assert.ok(
    fallbackBox.every((playerItem) => playerItem.position === 'DF' || playerItem.position === 'GK'),
    `Fallback acting-team box pool should use DF/GK when FW/MF are unavailable. Got: ${fallbackBox
      .map((playerItem) => playerItem.position)
      .join(', ')}`,
  );
}

function run(): void {
  runPassZoneRoleChecks();
  runLongPassZoneRoleChecks();
  runCornerReceiverShouldNotBeGoalkeeperWhenAlternativesExist();
  runContextBoxActingTeamSelectionChecks();
  console.log('OK - zone receiver coherence checks passed.');
}

run();
