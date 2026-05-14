import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SimulateWorldCupRequest {
  @ApiProperty({ example: 'arg' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({
    example: 'en',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional response language. Defaults to en.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'es'])
  lang?: string;
}
