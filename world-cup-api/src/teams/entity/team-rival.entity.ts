import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'team_rivals' })
export class TeamRivalEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  rivalryId: number;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 16 })
  rivalTeamId: string;
}
