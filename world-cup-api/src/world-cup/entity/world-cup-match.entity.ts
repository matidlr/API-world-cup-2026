import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';
import { WorldCupMatchResolution } from '../model/world-cup-match-resolution.enum';
import { WorldCupStage } from '../model/world-cup-stage.enum';

@Entity({ name: 'world_cup_matches' })
export class WorldCupMatchEntity extends AbstractBasicChatEntity {
  @PrimaryGeneratedColumn()
  worldCupMatchId: number;

  @Column({ type: 'varchar', length: 64 })
  worldCupId: string;

  @Column({ type: 'varchar', length: 32 })
  stage: WorldCupStage;

  @Column({ type: 'varchar', length: 2, nullable: true })
  groupName: string | null;

  @Column({ type: 'varchar', length: 64 })
  matchCode: string;

  @Column({ type: 'varchar', length: 16 })
  homeTeamId: string;

  @Column({ type: 'varchar', length: 120 })
  homeTeamName: string;

  @Column({ type: 'varchar', length: 16 })
  awayTeamId: string;

  @Column({ type: 'varchar', length: 120 })
  awayTeamName: string;

  @Column({ type: 'int', nullable: true })
  homeGoals: number | null;

  @Column({ type: 'int', nullable: true })
  awayGoals: number | null;

  @Column({ type: 'int', nullable: true })
  homePenaltyGoals: number | null;

  @Column({ type: 'int', nullable: true })
  awayPenaltyGoals: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  winnerTeamId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  winnerTeamName: string | null;

  @Column({ type: 'varchar', length: 32, default: WorldCupMatchResolution.PENDING })
  resolution: WorldCupMatchResolution;

  @Column({ type: 'boolean', default: false })
  isPending: boolean;

  @Column({ type: 'varchar', length: 16, nullable: true })
  playerOfMatchTeamId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  playerOfMatchTeamName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  playerOfMatchName: string | null;

  @Column({ type: 'int', default: 0 })
  homeTotalYellowCards: number;

  @Column({ type: 'int', default: 0 })
  homeTotalRedCards: number;

  @Column({ type: 'int', default: 0 })
  awayTotalYellowCards: number;

  @Column({ type: 'int', default: 0 })
  awayTotalRedCards: number;

  @Column({ type: 'text', default: '[]' })
  homeGoalsDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  awayGoalsDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  homeCardsDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  awayCardsDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  homeInjuriesDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  awayInjuriesDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  homeSubstitutionsDetailsJson: string;

  @Column({ type: 'text', default: '[]' })
  awaySubstitutionsDetailsJson: string;
}
