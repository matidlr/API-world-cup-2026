import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export class SelectStrategyRequest {
  @ApiProperty({ example: 'arg' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: ApiErrorCode.BAD_REQUEST })
  @MinLength(2, { message: ApiErrorCode.BAD_REQUEST })
  teamId: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.ATTACK })
  @IsEnum(MatchStrategy, { message: ApiErrorCode.BAD_REQUEST })
  strategy: MatchStrategy;

  @ApiProperty({ required: false, enum: ['es', 'en'], example: 'es' })
  @IsOptional()
  @IsIn(['es', 'en'], { message: ApiErrorCode.BAD_REQUEST })
  lang?: string;
}
