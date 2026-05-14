import { TeamPlayer } from 'src/teams/model/team-player.model';
import { FALLBACK_PLAYER } from '../model/match-engine.constants';

export abstract class AbstractMatchBasicHelper {
  protected random(): number {
    return Math.random();
  }

  protected randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  protected chance(probability: number): boolean {
    return this.random() < this.clamp(probability, 0, 1);
  }

  protected clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  protected pick<T>(items: T[], fallback?: T): T {
    if (!Array.isArray(items) || items.length === 0) {
      if (fallback !== undefined) {
        return fallback;
      }

      throw new Error('Cannot pick from an empty list without fallback');
    }

    return items[this.randomInt(0, items.length - 1)];
  }

  protected fallbackPlayer(overrides?: Partial<TeamPlayer>): TeamPlayer {
    return {
      ...FALLBACK_PLAYER,
      ...(overrides || {}),
    };
  }
}
