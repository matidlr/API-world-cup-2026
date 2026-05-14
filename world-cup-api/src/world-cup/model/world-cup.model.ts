import { ApiProperty } from '@nestjs/swagger';
import { WorldCupStatus } from './world-cup-status.enum';

export class WorldCup {
  @ApiProperty({ example: 'wc_2026_abc123' })
  worldCupId: string;

  @ApiProperty({ example: 2026 })
  edition: number;

  @ApiProperty({ enum: WorldCupStatus, example: WorldCupStatus.READY_FOR_FINAL })
  status: WorldCupStatus;

  @ApiProperty({ example: false })
  hasActiveFinal: boolean;

  @ApiProperty({ example: true })
  canResimulate: boolean;

  @ApiProperty({ example: true })
  canStartFinal: boolean;

  @ApiProperty({ example: 'arg' })
  selectedTeamId: string;

  @ApiProperty({ example: 'Argentina' })
  selectedTeamName: string;

  @ApiProperty({ example: 'arg' })
  finalHomeTeamId: string;

  @ApiProperty({ example: 'Argentina' })
  finalHomeTeamName: string;

  @ApiProperty({ example: 'fra' })
  finalAwayTeamId: string;

  @ApiProperty({ example: 'France' })
  finalAwayTeamName: string;

  @ApiProperty({ example: 'final_123', nullable: true })
  finalMatchId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
