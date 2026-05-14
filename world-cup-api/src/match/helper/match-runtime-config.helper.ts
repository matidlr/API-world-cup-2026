import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchRuntimeConfigHelperContract } from '../interfaces/match-runtime-config.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchLanguage } from '../model/match-language.model';
import {
  DEFAULT_AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE,
  DEFAULT_COACH_FORMATION_STYLE_STRICTNESS,
  DEFAULT_MATCH_LANGUAGE,
  DEFAULT_MESSAGES_PER_TURN,
  DEFAULT_OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH,
  DEFAULT_OPPONENT_TACTICS_COOLDOWN_TURNS,
  MATCH_ACTION_SET,
  MAX_COACH_FORMATION_STYLE_STRICTNESS,
  MAX_MESSAGES_PER_TURN,
  MAX_OPPONENT_TACTICS_COOLDOWN_TURNS,
  MIN_COACH_FORMATION_STYLE_STRICTNESS,
  MIN_MESSAGES_PER_TURN,
  MIN_TURNS_PER_MATCH,
} from '../model/match-engine.constants';
import { resolveEventMatrixEntry } from '../model/match-event-matrix.model';

@Injectable()
/**
 * Centralizes runtime/environment configuration parsing for the match engine.
 */
export class MatchRuntimeConfigHelper implements MatchRuntimeConfigHelperContract {
  constructor(private readonly configService: ConfigService) {}

  resolveLanguage(language?: string | MatchLanguage): MatchLanguage {
    if (!language) {
      return DEFAULT_MATCH_LANGUAGE;
    }

    return String(language).trim().toLowerCase() === 'es' ? 'es' : DEFAULT_MATCH_LANGUAGE;
  }

  loadActionsByEvent(): Record<MatchEventType, MatchAction[]> {
    const actionsByEvent = this.buildBaseActionsByEvent();

    actionsByEvent[MatchEventType.BALL_POSSESSION_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_NORMAL'),
      actionsByEvent[MatchEventType.BALL_POSSESSION_EVENT],
    );
    actionsByEvent[MatchEventType.KICKOFF_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_KICKOFF_EVENT'),
      actionsByEvent[MatchEventType.KICKOFF_EVENT],
    );
    actionsByEvent[MatchEventType.ATTACK_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_ATTACK_EVENT'),
      actionsByEvent[MatchEventType.ATTACK_EVENT],
    );
    actionsByEvent[MatchEventType.DEFENSE_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_DEFENSE_EVENT'),
      actionsByEvent[MatchEventType.DEFENSE_EVENT],
    );
    actionsByEvent[MatchEventType.PENALTY_FOR_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_PENALTY_FOR_EVENT'),
      actionsByEvent[MatchEventType.PENALTY_FOR_EVENT],
    );
    actionsByEvent[MatchEventType.PENALTY_AGAINST_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_PENALTY_AGAINST_EVENT'),
      actionsByEvent[MatchEventType.PENALTY_AGAINST_EVENT],
    );
    actionsByEvent[MatchEventType.FREE_KICK_FOR_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_FREE_KICK_FOR_EVENT'),
      actionsByEvent[MatchEventType.FREE_KICK_FOR_EVENT],
    );
    actionsByEvent[MatchEventType.FREE_KICK_AGAINST_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_FREE_KICK_AGAINST_EVENT'),
      actionsByEvent[MatchEventType.FREE_KICK_AGAINST_EVENT],
    );
    actionsByEvent[MatchEventType.CORNER_FOR_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_CORNER_FOR_EVENT'),
      actionsByEvent[MatchEventType.CORNER_FOR_EVENT],
    );
    actionsByEvent[MatchEventType.CORNER_AGAINST_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_CORNER_AGAINST_EVENT'),
      actionsByEvent[MatchEventType.CORNER_AGAINST_EVENT],
    );
    actionsByEvent[MatchEventType.THROW_IN_FOR_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_THROW_IN_FOR_EVENT'),
      actionsByEvent[MatchEventType.THROW_IN_FOR_EVENT],
    );
    actionsByEvent[MatchEventType.THROW_IN_AGAINST_EVENT] = this.parseActionList(
      this.configService.get<string>('MATCH_ACTIONS_THROW_IN_AGAINST_EVENT'),
      actionsByEvent[MatchEventType.THROW_IN_AGAINST_EVENT],
    );

    return actionsByEvent;
  }

  loadMaxTurnsPerMatch(): number {
    const rawValue = this.configService.get<string>('MAX_TURNS_PER_MATCH', String(MIN_TURNS_PER_MATCH));
    const parsed = Number(rawValue);

    if (!Number.isInteger(parsed)) {
      return MIN_TURNS_PER_MATCH + 1;
    }

    const clamped = Math.max(MIN_TURNS_PER_MATCH, parsed);
    return clamped % 2 === 0 ? clamped : clamped + 1;
  }

  loadMaxMessagesPerTurn(): number {
    const rawValue = this.configService.get<string>('MAX_MESSAGES_PER_TURN', String(DEFAULT_MESSAGES_PER_TURN));
    const parsed = Number(rawValue);

    if (!Number.isInteger(parsed)) {
      return DEFAULT_MESSAGES_PER_TURN;
    }

    return Math.min(MAX_MESSAGES_PER_TURN, Math.max(MIN_MESSAGES_PER_TURN, parsed));
  }

  loadMaxSubstitutionsPerTeam(): number {
    const rawValue = this.configService.get<string>('MAX_MATCH_SUBSTITUTIONS_PER_TEAM', '5');
    const parsed = Number(rawValue);

    if (!Number.isInteger(parsed) || parsed < 0) {
      return 5;
    }

    return parsed;
  }

  loadAutoAdjustFormationOnStrategyChange(): boolean {
    const rawValue = this.configService.get<string>(
      'AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE',
      String(DEFAULT_AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE),
    );
    return this.parseBooleanEnv(rawValue, DEFAULT_AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE);
  }

  loadOpponentTacticsOnlySecondHalfEnabled(): boolean {
    const rawValue = this.configService.get<string>('OPPONENT_TACTICS_ONLY_SECOND_HALF_ENABLED', 'true');
    return this.parseBooleanEnv(rawValue, true);
  }

  loadOpponentTacticsCooldownTurns(): number {
    const rawValue = this.configService.get<string>(
      'OPPONENT_TACTICS_COOLDOWN_TURNS',
      String(DEFAULT_OPPONENT_TACTICS_COOLDOWN_TURNS),
    );
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed)) {
      return DEFAULT_OPPONENT_TACTICS_COOLDOWN_TURNS;
    }

    return Math.max(0, Math.min(MAX_OPPONENT_TACTICS_COOLDOWN_TURNS, parsed));
  }

  loadOpponentMaxStrategyChangesPerMatch(): number {
    const rawValue = this.configService.get<string>(
      'OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH',
      String(DEFAULT_OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH),
    );
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed)) {
      return DEFAULT_OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH;
    }

    return Math.max(0, parsed);
  }

  loadCoachFormationStyleStrictness(): number {
    const rawValue = this.configService.get<string>(
      'COACH_FORMATION_STYLE_STRICTNESS',
      String(DEFAULT_COACH_FORMATION_STYLE_STRICTNESS),
    );
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed)) {
      return DEFAULT_COACH_FORMATION_STYLE_STRICTNESS;
    }

    return Math.min(
      MAX_COACH_FORMATION_STYLE_STRICTNESS,
      Math.max(MIN_COACH_FORMATION_STYLE_STRICTNESS, parsed),
    );
  }

  private buildBaseActionsByEvent(): Record<MatchEventType, MatchAction[]> {
    return Object.values(MatchEventType).reduce(
      (accumulator, eventType) => {
        const matrixEntry = resolveEventMatrixEntry(eventType);
        const merged = [...matrixEntry.userActions, ...matrixEntry.opponentActions];
        accumulator[eventType] = Array.from(new Set(merged));
        return accumulator;
      },
      {} as Record<MatchEventType, MatchAction[]>,
    );
  }

  private parseActionList(rawValue: string | undefined, fallback: MatchAction[]): MatchAction[] {
    if (!rawValue || rawValue.trim().length === 0) {
      return fallback;
    }

    const parsedValues = rawValue
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0);

    const uniqueValidActions = Array.from(new Set(parsedValues)).filter((value) =>
      MATCH_ACTION_SET.has(value),
    ) as MatchAction[];

    if (uniqueValidActions.length < 3) {
      return fallback;
    }

    return uniqueValidActions;
  }

  private parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
    if (!value) {
      return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }

    return fallback;
  }
}
