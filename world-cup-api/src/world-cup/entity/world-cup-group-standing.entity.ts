import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'world_cup_group_standings' })
export class WorldCupGroupStandingEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  standingId: number;

  @Column({ type: 'varchar', length: 64 })
  worldCupId: string;

  @Column({ type: 'varchar', length: 2 })
  groupName: string;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 120 })
  teamName: string;

  @Column({ type: 'varchar', length: 16 })
  confederation: string;

  @Column({ type: 'int', default: 0 })
  played: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  draws: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  goalsFor: number;

  @Column({ type: 'int', default: 0 })
  goalsAgainst: number;

  @Column({ type: 'int', default: 0 })
  goalDifference: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 4 })
  position: number;

  @Column({ type: 'boolean', default: false })
  isQualified: boolean;

  @Column({ type: 'boolean', default: false })
  isBestThird: boolean;
}
