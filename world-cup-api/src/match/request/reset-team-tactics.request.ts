import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';

export class ResetTeamTacticsRequest {
  @ApiProperty({ example: 'arg' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: ApiErrorCode.BAD_REQUEST })
  @MinLength(2, { message: ApiErrorCode.BAD_REQUEST })
  teamId: string;
}
