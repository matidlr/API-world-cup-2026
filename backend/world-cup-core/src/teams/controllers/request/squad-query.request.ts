import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LanguageEnum } from '../../../basic/model/language.enum';
import { SquadPositionFilterEnum } from '../../services/model/squad-service.enum';

export class SquadQueryRequest {
  @ApiPropertyOptional({ enum: [LanguageEnum.ES, LanguageEnum.EN], default: LanguageEnum.ES })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEnum(LanguageEnum)
  lang?: LanguageEnum;

  @ApiPropertyOptional({ example: 'messi' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  searchTerm?: string;

  @ApiPropertyOptional({ enum: SquadPositionFilterEnum, default: SquadPositionFilterEnum.ALL })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(SquadPositionFilterEnum)
  position?: SquadPositionFilterEnum;
}
