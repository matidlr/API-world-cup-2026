import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractBasicChatEntity } from 'src/basic/abstract-basic-chat-entity';

@Entity({ name: 'matches' })
export class MatchEntity extends AbstractBasicChatEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  matchId: string;

  @Column({ type: 'varchar', length: 16 })
  teamId: string;

  @Column({ type: 'varchar', length: 120 })
  teamName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  teamCoachName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  teamCaptainName: string | null;

  @Column({ type: 'varchar', length: 16 })
  opponentId: string;

  @Column({ type: 'varchar', length: 120 })
  opponentName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  opponentCoachName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  opponentCaptainName: string | null;

  @Column({ type: 'int', default: 0 })
  scoreTeam: number;

  @Column({ type: 'int', default: 0 })
  scoreOpponent: number;

  @Column({ type: 'int', default: 1 })
  minute: number;

  @Column({ type: 'int', default: 1 })
  turn: number;

  @Column({ type: 'int', default: 6 })
  maxTurns: number;

  @Column({ type: 'int', default: 5 })
  maxSubstitutions: number;

  @Column({ type: 'int', default: 0 })
  teamSubstitutionsUsed: number;

  @Column({ type: 'int', default: 0 })
  opponentSubstitutionsUsed: number;

  @Column({ type: 'int', default: 0 })
  opponentStrategyChangesUsed: number;

  @Column({ type: 'int', default: 0 })
  opponentLastTacticalChangeTurn: number;

  @Column({ type: 'varchar', length: 32, default: 'MIDFIELD' })
  currentZone: string;

  @Column({ type: 'varchar', length: 16, default: 'USER' })
  possessionTeam: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  ballCarrierTeamId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  ballCarrierName: string | null;

  @Column({ type: 'int', default: 0 })
  teamAttackPenalty: number;

  @Column({ type: 'int', default: 0 })
  teamMidfieldPenalty: number;

  @Column({ type: 'int', default: 0 })
  teamDefensePenalty: number;

  @Column({ type: 'int', default: 0 })
  opponentAttackPenalty: number;

  @Column({ type: 'int', default: 0 })
  opponentMidfieldPenalty: number;

  @Column({ type: 'int', default: 0 })
  opponentDefensePenalty: number;

  @Column({ type: 'int', default: 0 })
  teamMoraleBoostTurns: number;

  @Column({ type: 'int', default: 0 })
  teamMoralePenaltyTurns: number;

  @Column({ type: 'int', default: 0 })
  opponentMoraleBoostTurns: number;

  @Column({ type: 'int', default: 0 })
  opponentMoralePenaltyTurns: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  strategy: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  formation: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  opponentStrategy: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  opponentFormation: string | null;

  @Column({ type: 'varchar', length: 32, default: 'KICKOFF_EVENT' })
  eventType: string;

  @Column({ type: 'varchar', length: 280, default: '' })
  message: string;

  @Column({ type: 'text', default: '[]' })
  optionsJson: string;

  @Column({ type: 'text', nullable: true })
  lastContextJson: string | null;

  @Column({ type: 'boolean', default: false })
  isFinished: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
