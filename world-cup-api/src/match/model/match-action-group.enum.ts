import { MatchAction } from './match-action.enum';

export enum MatchAttackingActionEnum {
  ATTACK = MatchAction.ATTACK,
  SHOOT = MatchAction.SHOOT,
  DRIBBLE = MatchAction.DRIBBLE,
  CROSS = MatchAction.CROSS,
  LONG_PASS = MatchAction.LONG_PASS,
  LEFT = MatchAction.LEFT,
  RIGHT = MatchAction.RIGHT,
  CENTER = MatchAction.CENTER,
  PICAR = MatchAction.PICAR,
}

export enum MatchDefensiveActionEnum {
  DEFEND = MatchAction.DEFEND,
  PRESS = MatchAction.PRESS,
  BLOCK = MatchAction.BLOCK,
  TACKLE = MatchAction.TACKLE,
  DIVE_LEFT = MatchAction.DIVE_LEFT,
  DIVE_RIGHT = MatchAction.DIVE_RIGHT,
  STAY_CENTER = MatchAction.STAY_CENTER,
  WAIT = MatchAction.WAIT,
}

export enum MatchGoalkeeperActionEnum {
  DIVE_LEFT = MatchAction.DIVE_LEFT,
  DIVE_RIGHT = MatchAction.DIVE_RIGHT,
  STAY_CENTER = MatchAction.STAY_CENTER,
  WAIT = MatchAction.WAIT,
}

export const ATTACKING_ACTIONS = new Set<MatchAction>(
  Object.values(MatchAttackingActionEnum) as unknown as MatchAction[],
);

export const DEFENSIVE_ACTIONS = new Set<MatchAction>(
  Object.values(MatchDefensiveActionEnum) as unknown as MatchAction[],
);

export const GOALKEEPER_ACTIONS = new Set<MatchAction>(
  Object.values(MatchGoalkeeperActionEnum) as unknown as MatchAction[],
);
