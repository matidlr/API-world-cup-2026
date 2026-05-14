import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'world_cup_player_stats' })
export class WorldCupPlayerStatEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  playerStatId: number;

  @Column({ type: 'varchar', length: 64 })
  worldCupId: string;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 120 })
  teamName: string;

  @Column({ type: 'varchar', length: 64 })
  playerId: string;

  @Column({ type: 'varchar', length: 120 })
  playerName: string;

  @Column({ type: 'varchar', length: 8 })
  position: string;

  @Column({ type: 'int', default: 0 })
  goals: number;

  @Column({ type: 'int', default: 0 })
  assists: number;

  @Column({ type: 'int', default: 0 })
  cleanSheets: number;

  @Column({ type: 'int', default: 0 })
  yellowCards: number;

  @Column({ type: 'int', default: 0 })
  redCards: number;

  @Column({ type: 'int', default: 0 })
  minutesPlayed: number;

  @Column({ type: 'int', default: 0 })
  playerOfMatch: number;
}
