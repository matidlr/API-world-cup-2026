import { EventMatrixEntry } from '../interfaces/match-event-matrix.interface';
import { MatchAction } from './match-action.enum';
import { MatchEventType } from './match-event-type.enum';
import { MatchFieldZone } from './match-field-zone.enum';
import { MatchPossession } from './match-possession.enum';

export const DEFAULT_ALLOWED_ZONES: MatchFieldZone[] = [
  MatchFieldZone.DEFENSE_THIRD,
  MatchFieldZone.MIDFIELD,
  MatchFieldZone.ATTACK_THIRD,
  MatchFieldZone.BOX,
];

export const MATCH_EVENT_MATRIX: Record<MatchEventType, EventMatrixEntry> = {
  [MatchEventType.KICKOFF_EVENT]: {
    userActions: [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.DRIBBLE, MatchAction.HOLD],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.HALF_TIME_EVENT]: {
    userActions: [MatchAction.RESTART_MATCH, MatchAction.QUIT_MATCH],
    opponentActions: [MatchAction.RESTART_MATCH, MatchAction.QUIT_MATCH],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.BALL_POSSESSION_EVENT]: {
    userActions: [
      MatchAction.ATTACK,
      MatchAction.PASS,
      MatchAction.HOLD,
      MatchAction.SHOOT,
      MatchAction.DRIBBLE,
      MatchAction.LONG_PASS,
    ],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    allowedZones: DEFAULT_ALLOWED_ZONES,
  },
  [MatchEventType.ATTACK_EVENT]: {
    userActions: [MatchAction.SHOOT, MatchAction.DRIBBLE, MatchAction.PASS, MatchAction.CROSS],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    allowedZones: [MatchFieldZone.ATTACK_THIRD, MatchFieldZone.BOX, MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.DEFENSE_EVENT]: {
    userActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    opponentActions: [MatchAction.ATTACK, MatchAction.PASS, MatchAction.DRIBBLE, MatchAction.SHOOT],
    allowedZones: [MatchFieldZone.DEFENSE_THIRD, MatchFieldZone.MIDFIELD, MatchFieldZone.BOX],
  },
  [MatchEventType.PENALTY_FOR_EVENT]: {
    userActions: [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    opponentActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.PENALTY_AGAINST_EVENT]: {
    userActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    opponentActions: [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.FREE_KICK_FOR_EVENT]: {
    userActions: [MatchAction.CROSS, MatchAction.LONG_PASS, MatchAction.SHOOT, MatchAction.PASS],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    allowedZones: [MatchFieldZone.MIDFIELD, MatchFieldZone.ATTACK_THIRD, MatchFieldZone.BOX],
  },
  [MatchEventType.FREE_KICK_AGAINST_EVENT]: {
    userActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    opponentActions: [MatchAction.CROSS, MatchAction.LONG_PASS, MatchAction.SHOOT, MatchAction.PASS],
    allowedZones: [MatchFieldZone.DEFENSE_THIRD, MatchFieldZone.MIDFIELD, MatchFieldZone.BOX],
  },
  [MatchEventType.CORNER_FOR_EVENT]: {
    userActions: [MatchAction.CROSS, MatchAction.PASS, MatchAction.SHOOT, MatchAction.LONG_PASS],
    opponentActions: [MatchAction.BLOCK, MatchAction.DEFEND, MatchAction.PRESS, MatchAction.TACKLE],
    allowedZones: [MatchFieldZone.BOX, MatchFieldZone.ATTACK_THIRD],
  },
  [MatchEventType.CORNER_AGAINST_EVENT]: {
    userActions: [MatchAction.BLOCK, MatchAction.DEFEND, MatchAction.PRESS, MatchAction.TACKLE],
    opponentActions: [MatchAction.CROSS, MatchAction.PASS, MatchAction.SHOOT, MatchAction.LONG_PASS],
    allowedZones: [MatchFieldZone.BOX, MatchFieldZone.DEFENSE_THIRD],
  },
  [MatchEventType.THROW_IN_FOR_EVENT]: {
    userActions: [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.DRIBBLE, MatchAction.HOLD],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    allowedZones: [MatchFieldZone.MIDFIELD, MatchFieldZone.ATTACK_THIRD, MatchFieldZone.DEFENSE_THIRD],
  },
  [MatchEventType.THROW_IN_AGAINST_EVENT]: {
    userActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE],
    opponentActions: [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.DRIBBLE, MatchAction.HOLD],
    allowedZones: [MatchFieldZone.MIDFIELD, MatchFieldZone.ATTACK_THIRD, MatchFieldZone.DEFENSE_THIRD],
  },
  [MatchEventType.YELLOW_CARD_EVENT]: {
    userActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.RED_CARD_EVENT]: {
    userActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    opponentActions: [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT]: {
    userActions: [MatchAction.SHOOT, MatchAction.DRIBBLE, MatchAction.ATTACK, MatchAction.CENTER],
    opponentActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT]: {
    userActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    opponentActions: [MatchAction.SHOOT, MatchAction.DRIBBLE, MatchAction.ATTACK, MatchAction.CENTER],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT]: {
    userActions: [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    opponentActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT]: {
    userActions: [MatchAction.DIVE_LEFT, MatchAction.DIVE_RIGHT, MatchAction.STAY_CENTER, MatchAction.WAIT],
    opponentActions: [MatchAction.LEFT, MatchAction.RIGHT, MatchAction.CENTER, MatchAction.PICAR],
    allowedZones: [MatchFieldZone.BOX],
  },
  [MatchEventType.FORFEIT_EVENT]: {
    userActions: [],
    opponentActions: [],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
  [MatchEventType.END]: {
    userActions: [],
    opponentActions: [],
    allowedZones: [MatchFieldZone.MIDFIELD],
  },
};

export function resolveEventMatrixEntry(eventType: MatchEventType): EventMatrixEntry {
  return MATCH_EVENT_MATRIX[eventType] || MATCH_EVENT_MATRIX[MatchEventType.BALL_POSSESSION_EVENT];
}

export function resolveAllowedZonesForEvent(eventType: MatchEventType): MatchFieldZone[] {
  return resolveEventMatrixEntry(eventType).allowedZones || DEFAULT_ALLOWED_ZONES;
}

export function resolveActionsForEventAndPossession(
  eventType: MatchEventType,
  possession: MatchPossession,
): MatchAction[] {
  const entry = resolveEventMatrixEntry(eventType);
  return possession === MatchPossession.USER ? entry.userActions : entry.opponentActions;
}
