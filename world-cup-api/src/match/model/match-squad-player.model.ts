import { ApiProperty } from '@nestjs/swagger';
import { MatchPlayerEffectiveStats } from './match-player-effective-stats.model';
import { MatchPlayerStrategyImpact } from './match-player-strategy-impact.model';

export class MatchSquadPlayer {
  @ApiProperty({ example: 'ply_arg_01' })
  playerId: string;

  @ApiProperty({ example: 'Lionel Messi' })
  name: string;

  @ApiProperty({ example: 'FW' })
  position: string;

  @ApiProperty({ example: 10 })
  shirtNumber: number;

  @ApiProperty({ example: 31 })
  age: number;

  @ApiProperty({ example: 90 })
  skill: number;

  @ApiProperty({ example: 93 })
  attack: number;

  @ApiProperty({ example: 58 })
  defense: number;

  @ApiProperty({ example: 74 })
  energy: number;

  @ApiProperty({ example: true })
  isCaptain: boolean;

  @ApiProperty({ example: true })
  isStarter: boolean;

  @ApiProperty({ example: true })
  isOnField: boolean;

  @ApiProperty({ example: 1 })
  yellowCards: number;

  @ApiProperty({ example: false })
  redCard: boolean;

  @ApiProperty({ example: false })
  isInjured: boolean;

  @ApiProperty({ type: MatchPlayerStrategyImpact })
  strategyImpact: MatchPlayerStrategyImpact;

  @ApiProperty({ example: 0.95 })
  energyModifier: number;

  @ApiProperty({ type: MatchPlayerEffectiveStats })
  effectiveStats: MatchPlayerEffectiveStats;
}
