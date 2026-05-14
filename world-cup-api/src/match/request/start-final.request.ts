import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MATCH_SUPPORTED_LANGUAGES, MatchLanguage } from '../model/match-language.model';

export class StartFinalRequest {
  @ApiPropertyOptional({
    example: 'arg',
    description:
      'Optional finalist team id. When provided, it must be one of the two teams in the current world cup final.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: ApiErrorCode.BAD_REQUEST })
  @MinLength(2, { message: ApiErrorCode.BAD_REQUEST })
  teamId?: string;

  @ApiPropertyOptional({
    example: 'en',
    enum: MATCH_SUPPORTED_LANGUAGES,
    description: 'Optional language for option labels. Defaults to en.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsIn([...MATCH_SUPPORTED_LANGUAGES], { message: ApiErrorCode.BAD_REQUEST })
  lang?: MatchLanguage;
}
