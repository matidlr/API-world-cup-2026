import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'match_stats' })
export class MatchStatEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  statId: number;

  @Column({ type: 'varchar', length: 64 })
  matchId: string;

  @Column({ type: 'int', default: 1 })
  turn: number;

  @Column({ type: 'int', default: 1 })
  minute: number;

  @Column({ type: 'varchar', length: 32, default: 'KICKOFF_EVENT' })
  eventType: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  zone: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  action: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  teamId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  teamName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  playerId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  playerName: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  playerPosition: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  cardType: string | null;

  @Column({ type: 'boolean', default: false })
  isGoal: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  messageKey: string | null;

  @Column({ type: 'text', nullable: true })
  messageParamsJson: string | null;

  @Column({ type: 'varchar', length: 280, default: '' })
  message: string;
}
