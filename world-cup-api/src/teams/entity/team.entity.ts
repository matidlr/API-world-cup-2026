import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';

@Entity({ name: 'teams' })
export class TeamEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  groupName: string;

  @Column({ type: 'varchar', length: 16, default: 'UNASSIGNED' })
  footballAssociation: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 120 })
  coach: string;

  @Column({ type: 'varchar', length: 120 })
  captain: string;

  @Column({ type: 'varchar', length: 32, default: MatchStrategy.ATTACK })
  strategy: MatchStrategy;

  @Column({ type: 'varchar', length: 16, default: MatchFormation.F_4_3_3 })
  formation: MatchFormation;
}
