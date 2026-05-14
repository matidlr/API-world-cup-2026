import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';

@Entity({ name: 'team_tactics_defaults' })
export class TeamTacticsDefaultEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 32, default: MatchStrategy.ATTACK })
  defaultStrategy: MatchStrategy;

  @Column({ type: 'varchar', length: 16, default: MatchFormation.F_4_3_3 })
  defaultFormation: MatchFormation;
}
