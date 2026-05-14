import { TurnContext } from './match-turn-context.interface';

export interface TurnAdvanceResult {
  nextMinute: number;
  turnContext: TurnContext;
}
