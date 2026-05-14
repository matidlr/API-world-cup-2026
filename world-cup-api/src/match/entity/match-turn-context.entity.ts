import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'match_turn_contexts' })
export class MatchTurnContextEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  contextId: number;

  @Column({ type: 'varchar', length: 64 })
  matchId: string;

  @Column({ type: 'int', default: 1 })
  turn: number;

  @Column({ type: 'int', default: 1 })
  minute: number;

  @Column({ type: 'varchar', length: 24, default: 'TURN' })
  phase: string;

  @Column({ type: 'varchar', length: 32, default: 'KICKOFF_EVENT' })
  eventType: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  zone: string | null;

  @Column({ type: 'varchar', length: 16, default: 'USER' })
  possession: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  actingTeamId: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  defendingTeamId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  selectedAction: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actionOutcome: string | null;

  @Column({ type: 'varchar', length: 280, nullable: true })
  headline: string | null;

  @Column({ type: 'text' })
  contextJson: string;
}
