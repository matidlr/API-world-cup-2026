import { ApiProperty } from '@nestjs/swagger';
import { CoachEntity } from '../entity/coach.entity';
import { CoachProfile } from './coach-profile.enum';

export class Coach {
  @ApiProperty({ example: 'coach_arg' })
  coachId: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'Lionel Scaloni' })
  name: string;

  @ApiProperty({ example: 48 })
  age: number;

  @ApiProperty({ example: 'Argentina' })
  nationality: string;

  @ApiProperty({ enum: CoachProfile, example: CoachProfile.REACTIVE })
  profile: CoachProfile;

  @ApiProperty({ example: 68 })
  riskAppetite: number;

  @ApiProperty({ example: 76 })
  gameManagement: number;

  @ApiProperty({ example: 74 })
  adaptability: number;

  @ApiProperty({ example: 62 })
  pressingBias: number;

  @ApiProperty({ example: 63 })
  possessionBias: number;

  @ApiProperty({ example: 70 })
  defenseBias: number;

  @ApiProperty({ example: 3 })
  maxStrategyChanges: number;

  static fromEntityToModel(entity: CoachEntity, teamName: string): Coach {
    return {
      coachId: entity.coachId,
      teamId: entity.teamId,
      teamName,
      name: entity.name,
      age: entity.age,
      nationality: entity.nationality,
      profile: entity.profile,
      riskAppetite: entity.riskAppetite,
      gameManagement: entity.gameManagement,
      adaptability: entity.adaptability,
      pressingBias: entity.pressingBias,
      possessionBias: entity.possessionBias,
      defenseBias: entity.defenseBias,
      maxStrategyChanges: entity.maxStrategyChanges,
    };
  }
}

