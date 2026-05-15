import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { LanguageEnum } from '../../../basic/model/language.enum';

export class TeamHistoryQueryRequest {
  @ApiPropertyOptional({ enum: [LanguageEnum.ES, LanguageEnum.EN], default: LanguageEnum.ES })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEnum(LanguageEnum)
  lang?: LanguageEnum;
}
