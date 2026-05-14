import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'match_squad' })
export class MatchSquadEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  squadId: number;

  @Column({ type: 'varchar', length: 64 })
  matchId: string;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 64 })
  playerId: string;

  @Column({ type: 'varchar', length: 120 })
  playerName: string;

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

  @Column({ type: 'boolean', default: false })
  isCaptain: boolean;

  @Column({ type: 'boolean', default: false })
  isStarter: boolean;

  @Column({ type: 'boolean', default: false })
  isOnField: boolean;

  @Column({ type: 'int', default: 0 })
  yellowCards: number;

  @Column({ type: 'boolean', default: false })
  redCard: boolean;

  @Column({ type: 'boolean', default: false })
  isInjured: boolean;
}
