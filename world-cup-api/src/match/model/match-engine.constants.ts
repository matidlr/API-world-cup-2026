import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from './match-action.enum';
import {
  ATTACKING_ACTIONS,
  DEFENSIVE_ACTIONS,
  GOALKEEPER_ACTIONS,
} from './match-action-group.enum';
import { MatchEventType } from './match-event-type.enum';
import { MatchLanguage } from './match-language.model';

export const MATCH_ACTION_SET = new Set<string>(Object.values(MatchAction));

export const DEFAULT_MATCH_LANGUAGE: MatchLanguage = 'en';
export const MIN_TURNS_PER_MATCH = 5;
export const FULL_TEAM_LINEUP_SIZE = 11;
export const MIN_MESSAGES_PER_TURN = 2;
export const MAX_MESSAGES_PER_TURN = 20;
export const DEFAULT_MESSAGES_PER_TURN = 15;
export const DEFAULT_OPPONENT_TACTICS_COOLDOWN_TURNS = 1;
export const MAX_OPPONENT_TACTICS_COOLDOWN_TURNS = 10;
export const DEFAULT_OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH = 5;
export const DEFAULT_COACH_FORMATION_STYLE_STRICTNESS = 6;
export const MIN_COACH_FORMATION_STYLE_STRICTNESS = 0;
export const MAX_COACH_FORMATION_STYLE_STRICTNESS = 10;
export const DEFAULT_AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE = true;
export const HALF_TIME_VARIANT_COUNT = 20;
export const FINAL_WHISTLE_VARIANT_COUNT = 10;
export const START_KICKOFF_VARIANT_COUNT = 5;
export const TURN_CONTEXT_VARIANT_COUNT = 15;
export const TURN_RESULT_VARIANT_COUNT = 15;
export const TURN_RESULT_OUTCOME_VARIANT_COUNT = 15;

export const FALLBACK_PLAYER: TeamPlayer = {
  playerId: 'unknown',
  name: 'Unknown Player',
  position: 'MF',
  shirtNumber: 0,
  age: 18,
  skill: 60,
  attack: 60,
  defense: 60,
  energy: 60,
  isCaptain: false,
};

export const TURN_CONTEXT_VARIANT_ACTIONS = new Set<MatchAction>([
  MatchAction.ATTACK,
  MatchAction.HOLD,
  MatchAction.PRESS,
  MatchAction.LONG_PASS,
  MatchAction.SHOOT,
  MatchAction.PASS,
  MatchAction.DRIBBLE,
  MatchAction.CROSS,
  MatchAction.DEFEND,
  MatchAction.LEFT,
  MatchAction.RIGHT,
  MatchAction.CENTER,
  MatchAction.PICAR,
  MatchAction.DIVE_LEFT,
  MatchAction.DIVE_RIGHT,
  MatchAction.STAY_CENTER,
  MatchAction.WAIT,
  MatchAction.TACKLE,
  MatchAction.BLOCK,
]);

export const TURN_RESULT_VARIANT_ACTIONS = new Set<MatchAction>([
  MatchAction.ATTACK,
  MatchAction.HOLD,
  MatchAction.PRESS,
  MatchAction.LONG_PASS,
  MatchAction.SHOOT,
  MatchAction.PASS,
  MatchAction.DRIBBLE,
  MatchAction.CROSS,
  MatchAction.DEFEND,
  MatchAction.LEFT,
  MatchAction.RIGHT,
  MatchAction.CENTER,
  MatchAction.PICAR,
  MatchAction.DIVE_LEFT,
  MatchAction.DIVE_RIGHT,
  MatchAction.STAY_CENTER,
  MatchAction.WAIT,
  MatchAction.BLOCK,
  MatchAction.TACKLE,
]);

export const TECHNICAL_TIMELINE_EVENT_TYPES = new Set<MatchEventType>([
  MatchEventType.KICKOFF_EVENT,
  MatchEventType.HALF_TIME_EVENT,
  MatchEventType.FREE_KICK_FOR_EVENT,
  MatchEventType.FREE_KICK_AGAINST_EVENT,
  MatchEventType.CORNER_FOR_EVENT,
  MatchEventType.CORNER_AGAINST_EVENT,
  MatchEventType.THROW_IN_FOR_EVENT,
  MatchEventType.THROW_IN_AGAINST_EVENT,
]);
