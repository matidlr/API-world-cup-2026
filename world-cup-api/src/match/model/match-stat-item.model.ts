import { ApiProperty } from '@nestjs/swagger';
import { MatchCardType } from './match-card-type.enum';
import { MatchEventType } from './match-event-type.enum';
import { MatchFieldZone } from './match-field-zone.enum';

export class MatchStatItem {
  @ApiProperty({ example: 1 })
  statId: number;

  @ApiProperty({ example: 25 })
  minute: number;

  @ApiProperty({ example: 2 })
  turn: number;

  @ApiProperty({ enum: MatchEventType, example: MatchEventType.ATTACK_EVENT })
  eventType: MatchEventType;

  @ApiProperty({ enum: MatchFieldZone, required: false, nullable: true })
  zone: MatchFieldZone | null;

  @ApiProperty({ example: 'SHOOT', required: false, nullable: true })
  action: string | null;

  @ApiProperty({ example: 'arg', required: false, nullable: true })
  teamId: string | null;

  @ApiProperty({ example: 'Argentina', required: false, nullable: true })
  teamName: string | null;

  @ApiProperty({ example: 'Lionel Messi', required: false, nullable: true })
  playerName: string | null;

  @ApiProperty({ example: 'FW', required: false, nullable: true })
  playerPosition: string | null;

  @ApiProperty({ enum: MatchCardType, required: false, nullable: true })
  cardType: MatchCardType | null;

  @ApiProperty({ example: true })
  isGoal: boolean;

  @ApiProperty({ example: 'Goal for Argentina by Lionel Messi' })
  message: string;

  @ApiProperty()
  creationDate: Date;
}
