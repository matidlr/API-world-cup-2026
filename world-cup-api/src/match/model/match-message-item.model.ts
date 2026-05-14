import { ApiProperty } from '@nestjs/swagger';
import { MatchMessageType } from './match-message-type.enum';

export class MatchMessageItem {
  @ApiProperty({ required: false, nullable: true, example: 'match.start.kickoff.variant.2' })
  messageKey?: string | null;

  @ApiProperty({ enum: MatchMessageType, example: MatchMessageType.SUBSTITUTION })
  type: MatchMessageType;

  @ApiProperty({
    example: 'Argentina substitution: Leandro Paredes replaces Rodrigo De Paul.',
  })
  text: string;

  @ApiProperty({ example: 53 })
  minute: number;

  @ApiProperty({ example: 4 })
  turn: number;

  @ApiProperty({ required: false, nullable: true, example: 'arg' })
  teamId?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'Argentina' })
  teamName?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'Leandro Paredes' })
  playerName?: string | null;
}
