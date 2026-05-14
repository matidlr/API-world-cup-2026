import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';
import { WorldCupStatus } from '../model/world-cup-status.enum';

@Entity({ name: 'world_cups' })
export class WorldCupEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  worldCupId: string;

  @Column({ type: 'int', default: 2026 })
  edition: number;

  @Column({ type: 'varchar', length: 32, default: WorldCupStatus.READY_FOR_FINAL })
  status: WorldCupStatus;

  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  @Column({ type: 'varchar', length: 16 })
  selectedTeamId: string;

  @Column({ type: 'varchar', length: 120 })
  selectedTeamName: string;

  @Column({ type: 'varchar', length: 16 })
  finalHomeTeamId: string;

  @Column({ type: 'varchar', length: 120 })
  finalHomeTeamName: string;

  @Column({ type: 'varchar', length: 16 })
  finalAwayTeamId: string;

  @Column({ type: 'varchar', length: 120 })
  finalAwayTeamName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  finalMatchId: string | null;

  @Column({ type: 'text', default: '[]' })
  notesJson: string;
}
