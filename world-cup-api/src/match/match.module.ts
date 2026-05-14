import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nService } from 'src/i18n/i18n.service';
import { TeamsModule } from 'src/teams/teams.module';
import { MatchController } from './match.controller';
import { MatchSquadEntity } from './entity/match-squad.entity';
import { MatchStatEntity } from './entity/match-stat.entity';
import { MatchEntity } from './entity/match.entity';
import { MatchTurnContextEntity } from './entity/match-turn-context.entity';
import { MatchNarrativeHelper } from './helper/match-narrative.helper';
import { MatchProbabilityHelper } from './helper/match-probability.helper';
import { MatchCoachTacticsHelper } from './helper/match-coach-tactics.helper';
import { MatchActionTransitionHelper } from './helper/match-action-transition.helper';
import { MatchContextBuilderHelper } from './helper/match-context-builder.helper';
import { MatchDuelHelper } from './helper/match-duel.helper';
import { MatchSquadRulesHelper } from './helper/match-squad-rules.helper';
import { MatchTacticalHelper } from './helper/match-tactical.helper';
import { MatchTurnOrchestratorHelper } from './helper/match-turn-orchestrator.helper';
import { MatchEngine } from './helper/match-engine.helper';
import { MatchPlayerSelectionHelper } from './helper/match-player-selection.helper';
import { MatchTurnInputHelper } from './helper/match-turn-input.helper';
import { MatchGoalScorerHelper } from './helper/match-goal-scorer.helper';
import { MatchDisciplineHelper } from './helper/match-discipline.helper';
import { MatchTurnOptionsHelper } from './helper/match-turn-options.helper';
import { MatchActionOutcomeHelper } from './helper/match-action-outcome.helper';
import { MatchRuntimeConfigHelper } from './helper/match-runtime-config.helper';
import { MatchPersistenceHelper } from './helper/match-persistence.helper';
import { MatchFinalMessageHelper } from './helper/match-final-message.helper';
import { MatchNarrativeVariantHelper } from './helper/match-narrative-variant.helper';
import { MatchCoachTurnHelper } from './helper/match-coach-turn.helper';
import { MatchResponseMapperHelper } from './helper/match-response-mapper.helper';
import { MatchTurnMessageHelper } from './helper/match-turn-message.helper';
import { MatchStartFinalHelper } from './helper/match-start-final.helper';
import { MatchPlayPrepareHelper } from './helper/match-play-prepare.helper';
import { MatchPlaySpecialEventsHelper } from './helper/match-play-special-events.helper';
import { MatchPlaySpecialEventResponseHelper } from './helper/match-play-special-event-response.helper';
import { MatchPlayTurnPipelineHelper } from './helper/match-play-turn-pipeline.helper';
import { MatchPlayPostTurnHelper } from './helper/match-play-post-turn.helper';
import { MatchPlayResponseHelper } from './helper/match-play-response.helper';
import { MatchTurnOutputHelper } from './helper/match-turn-output.helper';
import { MatchTurnFlowHelper } from './helper/match-turn-flow.helper';
import { MatchOpenPlayRestartHelper } from './helper/match-open-play-restart.helper';
import { MatchPenaltyResolutionHelper } from './helper/match-penalty-resolution.helper';
import { MatchOutcomeMessageHelper } from './helper/match-outcome-message.helper';
import { MatchService } from './match.service';
import { WorldCupModule } from 'src/world-cup/world-cup.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchEntity, MatchStatEntity, MatchSquadEntity, MatchTurnContextEntity]),
    TeamsModule,
    WorldCupModule,
  ],
  controllers: [MatchController],
  providers: [
    MatchService,
    I18nService,
    MatchNarrativeHelper,
    MatchProbabilityHelper,
    MatchCoachTacticsHelper,
    MatchActionTransitionHelper,
    MatchContextBuilderHelper,
    MatchDuelHelper,
    MatchTacticalHelper,
    MatchSquadRulesHelper,
    MatchPlayerSelectionHelper,
    MatchTurnOrchestratorHelper,
    MatchTurnInputHelper,
    MatchGoalScorerHelper,
    MatchDisciplineHelper,
    MatchTurnOptionsHelper,
    MatchActionOutcomeHelper,
    MatchRuntimeConfigHelper,
    MatchPersistenceHelper,
    MatchFinalMessageHelper,
    MatchNarrativeVariantHelper,
    MatchCoachTurnHelper,
    MatchResponseMapperHelper,
    MatchTurnMessageHelper,
    MatchStartFinalHelper,
    MatchPlayPrepareHelper,
    MatchPlaySpecialEventsHelper,
    MatchPlaySpecialEventResponseHelper,
    MatchPlayTurnPipelineHelper,
    MatchPlayPostTurnHelper,
    MatchPlayResponseHelper,
    MatchTurnOutputHelper,
    MatchTurnFlowHelper,
    MatchOpenPlayRestartHelper,
    MatchPenaltyResolutionHelper,
    MatchOutcomeMessageHelper,
    MatchEngine,
  ],
  exports: [MatchService],
})
export class MatchModule {}
