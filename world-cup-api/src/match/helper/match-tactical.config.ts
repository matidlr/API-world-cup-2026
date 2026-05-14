import { MatchFormation } from '../model/match-formation.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export const ALL_FORMATIONS = Object.values(MatchFormation);
export const ALL_STRATEGIES = Object.values(MatchStrategy);

export const STRATEGY_COMPATIBILITY: Record<MatchStrategy, MatchFormation[]> = {
  [MatchStrategy.ATTACK]: [
    MatchFormation.F_4_3_3,
    MatchFormation.F_3_4_3,
    MatchFormation.F_4_3_2_1,
    MatchFormation.F_4_3_1_2,
  ],
  [MatchStrategy.DEFENSE]: [
    MatchFormation.F_5_4_1,
    MatchFormation.F_5_3_2,
    MatchFormation.F_4_5_1,
    MatchFormation.F_4_1_4_1,
    MatchFormation.F_4_4_2,
  ],
  [MatchStrategy.PENALTIES]: [
    MatchFormation.F_4_4_2,
    MatchFormation.F_4_1_4_1,
    MatchFormation.F_5_4_1,
    MatchFormation.F_4_2_3_1,
  ],
  [MatchStrategy.COUNTER_ATTACK]: [
    MatchFormation.F_4_4_2,
    MatchFormation.F_3_5_2,
    MatchFormation.F_3_4_1_2,
    MatchFormation.F_5_3_2,
  ],
  [MatchStrategy.BALANCED]: ALL_FORMATIONS,
  [MatchStrategy.POSSESSION]: [
    MatchFormation.F_4_3_3,
    MatchFormation.F_4_2_3_1,
    MatchFormation.F_4_1_2_1_2,
    MatchFormation.F_4_3_1_2,
    MatchFormation.F_3_1_4_2,
  ],
};
