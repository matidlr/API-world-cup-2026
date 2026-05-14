import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchFormation } from '../model/match-formation.enum';

export class SelectFormationRequest {
  @ApiProperty({ example: 'arg' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: ApiErrorCode.BAD_REQUEST })
  @MinLength(2, { message: ApiErrorCode.BAD_REQUEST })
  teamId: string;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  @IsEnum(MatchFormation, { message: ApiErrorCode.BAD_REQUEST })
  formation: MatchFormation;

  @ApiProperty({ required: false, enum: ['es', 'en'], example: 'es' })
  @IsOptional()
  @IsIn(['es', 'en'], { message: ApiErrorCode.BAD_REQUEST })
  lang?: string;
}
