import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'team_history' })
export class TeamHistoryEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  historyId: number;

  @Column({ type: 'varchar', length: 16, unique: true })
  teamId: string;

  @Column({ type: 'text' })
  titlesJson: string;
}
