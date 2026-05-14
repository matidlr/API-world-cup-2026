import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'team_players' })
export class TeamPlayerEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  playerId: string;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  position: string;

  @Column({ type: 'int', default: 0 })
  shirtNumber: number;

  @Column({ type: 'int', default: 18 })
  age: number;

  @Column({ type: 'int', default: 70 })
  skill: number;

  @Column({ type: 'int', default: 70 })
  attack: number;

  @Column({ type: 'int', default: 70 })
  defense: number;

  @Column({ type: 'int', default: 80 })
  energy: number;
}
