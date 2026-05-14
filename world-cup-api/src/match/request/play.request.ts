import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MATCH_SUPPORTED_LANGUAGES, MatchLanguage } from '../model/match-language.model';

export class PlayRequest {
  @ApiProperty({
    example: 2,
    minimum: 1,
    maximum: 4,
    description: 'Select one option index returned by the previous response. (Half-time uses 1..2.)',
  })
  @Type(() => Number)
  @IsInt({ message: ApiErrorCode.BAD_REQUEST })
  @Min(1, { message: ApiErrorCode.INVALID_SELECTED_OPTION })
  @Max(4, { message: ApiErrorCode.INVALID_SELECTED_OPTION })
  selectedOption: number;

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
