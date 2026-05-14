import { ApiProperty } from '@nestjs/swagger';
import { TeamPlayerEntity } from '../entity/team-player.entity';

export class TeamPlayer {
  @ApiProperty({ example: 'ply_arg_01' })
  playerId: string;

  @ApiProperty({ example: 'Lionel Messi' })
  name: string;

  @ApiProperty({ example: 'FW' })
  position: string;

  @ApiProperty({ example: 10 })
  shirtNumber: number;

  @ApiProperty({ example: 38 })
  age: number;

  @ApiProperty({ example: 86 })
  skill: number;

  @ApiProperty({ example: 91 })
  attack: number;

  @ApiProperty({ example: 58 })
  defense: number;

  @ApiProperty({ example: 89 })
  energy: number;

  @ApiProperty({ example: true })
  isCaptain: boolean;

  static fromEntityToModel(entity: TeamPlayerEntity, isCaptain = false): TeamPlayer {
    return {
      playerId: entity.playerId,
      name: entity.name,
      position: entity.position,
      shirtNumber: entity.shirtNumber,
      age: entity.age,
      skill: entity.skill,
      attack: entity.attack,
      defense: entity.defense,
      energy: entity.energy,
      isCaptain,
    };
  }
}
