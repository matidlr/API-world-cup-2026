import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { TeamHistoryEntity } from '../entity/team-history.entity';

export class TeamTitleAchievement {
  @ApiProperty({ example: 'FIFA' })
  org: string;

  @ApiProperty({ example: 'World Cup' })
  tournament: string;

  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ type: [String], example: ['1978', '1986', '2022'] })
  years: string[];

  @ApiProperty({ type: [String], example: ['Argentina', 'Mexico', 'Qatar'] })
  hosts: string[];
}

@ApiExtraModels(TeamTitleAchievement)
export class TeamHistory {
  @ApiProperty({
    type: 'array',
    items: { oneOf: [{ type: 'string' }, { $ref: getSchemaPath(TeamTitleAchievement) }] },
    example: [
      {
        org: 'FIFA',
        tournament: 'World Cup',
        count: 3,
        years: ['1978', '1986', '2022'],
        hosts: ['Argentina', 'Mexico', 'Qatar'],
      },
    ],
  })
  titles: Array<string | TeamTitleAchievement>;

  static fromEntityToModel(entity: TeamHistoryEntity): TeamHistory {
    let parsedTitles: Array<string | TeamTitleAchievement> = [];
    try {
      const parsed = JSON.parse(entity.titlesJson);
      parsedTitles = Array.isArray(parsed) ? (parsed as Array<string | TeamTitleAchievement>) : [];
    } catch {
      parsedTitles = [];
    }

    return {
      titles: parsedTitles,
    };
  }
}
