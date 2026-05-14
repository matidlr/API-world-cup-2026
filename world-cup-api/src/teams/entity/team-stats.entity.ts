import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'team_stats' })
export class TeamStatsEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  statsId: number;

  @Column({ type: 'varchar', length: 16, unique: true })
  teamId: string;

  @Column({ type: 'int' })
  attack: number;

  @Column({ type: 'int' })
  defense: number;

  @Column({ type: 'int' })
  midfield: number;

  @Column({ type: 'int' })
  overall: number;
}
