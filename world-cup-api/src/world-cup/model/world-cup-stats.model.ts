import { ApiProperty } from '@nestjs/swagger';
import { WorldCupCardStats } from './world-cup-card-stats.model';
import { WorldCupPlayerStat } from './world-cup-player-stat.model';
import { WorldCupPodiumTeam } from './world-cup-podium-team.model';

export class WorldCupStats {
  @ApiProperty({ example: 104 })
  totalMatches: number;

  @ApiProperty({ example: 276 })
  totalGoals: number;

  @ApiProperty({ example: 2.65 })
  avgGoalsPerMatch: number;

  @ApiProperty({ type: WorldCupPodiumTeam, nullable: true })
  champion: WorldCupPodiumTeam | null;

  @ApiProperty({ type: WorldCupPodiumTeam, nullable: true })
  runnerUp: WorldCupPodiumTeam | null;

  @ApiProperty({ type: WorldCupPodiumTeam, nullable: true })
  thirdPlace: WorldCupPodiumTeam | null;

  @ApiProperty({ type: WorldCupPodiumTeam, nullable: true })
  fourthPlace: WorldCupPodiumTeam | null;

  @ApiProperty({ type: [WorldCupPlayerStat] })
  topScorers: WorldCupPlayerStat[];

  @ApiProperty({ type: [WorldCupPlayerStat] })
  topAssists: WorldCupPlayerStat[];

  @ApiProperty({ type: [WorldCupPlayerStat] })
  bestGoalkeepers: WorldCupPlayerStat[];

  @ApiProperty({ type: [WorldCupPlayerStat] })
  cleanSheetLeaders: WorldCupPlayerStat[];

  @ApiProperty({ type: WorldCupPlayerStat, nullable: true })
  topPlayerOfMatch: WorldCupPlayerStat | null;

  @ApiProperty({ type: WorldCupCardStats })
  cards: WorldCupCardStats;
}
