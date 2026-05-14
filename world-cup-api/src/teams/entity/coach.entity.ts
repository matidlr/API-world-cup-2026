import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';
import { CoachProfile } from '../model/coach-profile.enum';

@Entity({ name: 'coaches' })
export class CoachEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  coachId: string;

  @Column({ type: 'varchar', length: 16, unique: true })
  teamId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'int', default: 50 })
  age: number;

  @Column({ type: 'varchar', length: 80 })
  nationality: string;

  @Column({ type: 'varchar', length: 32, default: CoachProfile.BALANCED })
  profile: CoachProfile;

  @Column({ type: 'int', default: 50 })
  riskAppetite: number;

  @Column({ type: 'int', default: 50 })
  gameManagement: number;

  @Column({ type: 'int', default: 50 })
  adaptability: number;

  @Column({ type: 'int', default: 50 })
  pressingBias: number;

  @Column({ type: 'int', default: 50 })
  possessionBias: number;

  @Column({ type: 'int', default: 50 })
  defenseBias: number;

  @Column({ type: 'int', default: 3 })
  maxStrategyChanges: number;
}

