# Match Transition & Narrative Coherence Refactor Plan

## Goal
- Improve turn coherence and narrative consistency in match flow.
- Use a single, explicit transition source for `action + zone + possession`.
- Keep architecture helper-driven:
  - `MatchService` as facade.
  - `MatchEngine` as lightweight orchestrator.
  - business rules in specialized helpers.

## Design Principles
- Baseline first, refactor second, compare after.
- No hidden behavior: transitions must be deterministic by rule table + probabilities.
- Narrative must match the real executor and real outcome.
- Every phase is checkable and markable.

## Phases

### Phase 0 - Baseline (100 Random Finals)
Status: [x] Completed (Baseline Run #1 captured)

Objective:
- Capture current behavior before new transition/narrative changes.
- Produce a comparable baseline report.

Use existing script:
- `scripts/tests/run-random-finals.mjs`

Run command:
- `node ./scripts/tests/run-random-finals.mjs 100`

Output location:
- `scripts/tests/reports/random_100_matches_<timestamp>.json`

Checklist:
- [x] API running and reachable (`WC_API_BASE` if non-default).
- [x] Run 100 random finals with current code.
- [x] Confirm JSON report generated in `scripts/tests/reports`.
- [x] Save summary snapshot in this doc (or companion markdown).
- [x] Keep report file reference for post-refactor comparison.
- [x] Include rivalry-specific audit (momentum message + morale effect windows).

Baseline KPIs (from script aggregate):
- `totalShotsByUser`
- `totalShotsUserGoal`
- `totalShotsUserConcede`
- `totalDefensiveActions`
- `totalDefensiveConcede`
- `totalCounterGoalMessages`
- `totalPenaltyResolvedSameTurn`
- `totalRivalryTriggers`
- `totalTurnsWithContext`
- `totalTurns`
- `averageTurns`

Coherence audit strategy:
- Run automated coherence audit on all 100 matches.
- Keep manual deep-dive on a smaller sample for qualitative narrative review.
- Suggested manual sample: 10-20 matches.

Manual audit sample focus:
- Review sample matches and tag:
  - perspective mismatches (user action narrated as rival action)
  - impossible action context (options vs possession/zone)
  - contradictory outcome messages
  - suspicious rebound continuity

Rivalry audit (required in baseline):
- Identify matches with rivalry (`isRivalryMatch` true in context/turn logs when available).
- For each rivalry goal:
  - verify momentum narrative appears (`match.rivalry.momentum` / translated text).
  - verify 2-turn morale window applies:
    - scorer side: `MoraleBoostTurns`
    - conceded side: `MoralePenaltyTurns`
- Compare conversion tendency during morale window vs normal turns.

#### Baseline Run #1 Snapshot

- Date: 2026-05-04
- Command: `node ./scripts/tests/run-random-finals.mjs 100`
- Report file:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-04T17-45-06-179Z.json`

Aggregate:
- totalShotsByUser: `69`
- totalShotsUserGoal: `27`
- totalShotsUserConcede: `4`
- totalDefensiveActions: `495`
- totalDefensiveConcede: `0`
- totalCounterGoalMessages: `22`
- totalPenaltyResolvedSameTurn: `0`
- totalRivalryTriggers: `8`
- totalTurnsWithContext: `1148`
- totalTurns: `1148`
- averageTurns: `11.48`

Derived:
- userShotGoalRate: `0.3913`
- userShotConcedeRate: `0.0580`
- defensiveConcedeRate: `0.0000`
- contextCoverage: `1.0000`
- counterGoalPerMatch: `0.2200`
- rivalryTriggersPerMatch: `0.0800`

Rivalry quick audit:
- rivalryMatches: `16`
- detectedGoalTurnsInRivalry: `17`
- rivalryTurnsWithMomentumMessage: `8`

Pending for full rivalry verification in future iteration:
- explicit verification of 2-turn morale swing effect after each rivalry goal.

#### Post-Fix Validation Run #2 (After Halftime/SHOOT Fixes)

- Date: 2026-05-04
- Command: `node ./scripts/tests/run-random-finals.mjs 100`
- Report file:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-04T19-50-38-075Z.json`

Aggregate:
- totalShotsByUser: `93`
- totalShotsUserGoal: `25`
- totalShotsUserConcede: `2`
- totalDefensiveActions: `514`
- totalDefensiveConcede: `2`
- totalCounterGoalMessages: `36`
- totalPenaltyResolvedSameTurn: `0`
- totalRivalryTriggers: `10`
- totalTurnsWithContext: `1139`
- totalTurns: `1139`
- averageTurns: `11.39`

Coherence checks (targeted):
- `selectedNotInAvailableBefore = 0` ✅
- `halftimeDrift = 0` ✅
  - no `before.eventType = KICKOFF_EVENT` combined with `context.before.eventType = HALF_TIME_EVENT`
- user attacking zones with missing `SHOOT`:
  - raw count: `17`
  - playable/open-play count: `0` ✅
  - all `17` correspond to penalty-family contexts (expected action set differs by design).

#### Baseline Deep Audit Run #3 (Current Engine Snapshot)

- Date: 2026-05-04
- Command: `node ./scripts/tests/run-random-finals.mjs 100`
- Report file:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-04T20-52-09-332Z.json`

Focused findings (coherence/performance):
- Defensive recovery while user is defending remains low:
  - defensive turns analyzed: `679`
  - possession recovered by user: `83`
  - recovery rate: `12.2%`
- User goals coming after defensive actions are too frequent:
  - total user goals (final scores aggregate): `150`
  - goals generated from defensive-action turns: `111`
- PASS/LONG_PASS continuity is mostly good but not fully zone-coherent:
  - pass/long-pass turns with user possession: `106`
  - possession retained: `80` (`75.5%`)
  - when retained, next carrier inside applied `teammatesInZone`: `62/80` (`77.5%`)
  - outside applied zone list: `18/80` (`22.5%`)
- `SHOOT` visibility in user attacking zones remains acceptable:
  - attacking-zone turns checked: `132`
  - with `SHOOT` present: `122` (`92.4%`)
  - missing `SHOOT`: penalty-family contexts only.

#### Validation Run #4 (After Recovery/Counter/Pass-Receiver Tuning)

- Date: 2026-05-04
- Command: `node ./scripts/tests/run-random-finals.mjs 100`
- Report file:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-04T22-10-14-998Z.json`

Aggregate:
- totalShotsByUser: `56`
- totalShotsUserGoal: `37`
- totalShotsUserConcede: `0`
- totalDefensiveActions: `449`
- totalDefensiveConcede: `0`
- totalCounterGoalMessages: `19`
- totalPenaltyResolvedSameTurn: `0`
- totalRivalryTriggers: `15`
- totalTurnsWithContext: `1147`
- totalTurns: `1147`
- averageTurns: `11.47`

Targeted coherence metrics:
- Defensive recovery turns:
  - defensive turns analyzed: `474`
  - possession recovered by user: `195` (`41.1%`)
  - (previous audit run #3: `12.2%`)
- Defensive-action immediate user goals:
  - `0` in this sample.
- PASS/LONG_PASS receiver coherence:
  - possession retained after pass/long pass: `155/222` (`69.8%`)
  - next carrier inside applied `teammatesInZone`: `145/155` (`93.6%`)
  - (previous audit run #3: `77.5%`)

#### Baseline Inconsistency Findings (Phase 0 Audit)

- Halftime context/state drift detected in logs:
  - observed pattern (100/100 matches at turn 7 in baseline sample):
    - `before.eventType = KICKOFF_EVENT`
    - `context.before.eventType = HALF_TIME_EVENT`
    - `context.before.availableActions = [RESTART_MATCH, QUIT_MATCH]`
    - selected action already belongs to regular second-half flow.
  - This indicates context snapshot lag/drift around halftime restart transitions.
  - Note: user-facing halftime menu can still look correct; issue is persisted context coherence.

- UX/gameplay rule to enforce:
  - when user has possession in:
    - `ATTACK_THIRD`
    - `BOX`
  - available options must always include `SHOOT`.
  - this is required for gameplay consistency and tactical clarity.

#### Baseline Report Format (Template)

```md
# Baseline Report - Phase 0

Date:
Commit:
Command:
Report File:

## Aggregate
- totalShotsByUser:
- totalShotsUserGoal:
- totalShotsUserConcede:
- totalDefensiveActions:
- totalDefensiveConcede:
- totalCounterGoalMessages:
- totalPenaltyResolvedSameTurn:
- totalRivalryTriggers:
- totalTurnsWithContext:
- totalTurns:
- averageTurns:

## Derived Ratios
- userShotGoalRate = totalShotsUserGoal / totalShotsByUser
- userShotConcedeRate = totalShotsUserConcede / totalShotsByUser
- defensiveConcedeRate = totalDefensiveConcede / totalDefensiveActions
- contextCoverage = totalTurnsWithContext / totalTurns

## Manual Coherence Audit (sample 10-20 matches)
- perspective mismatches:
- option/context mismatches:
- contradictory narrative outcomes:
- rebound continuity issues:

## Rivalry Audit
- rivalry matches analyzed:
- rivalry goals detected:
- momentum messages shown:
- morale windows verified (2 turns):
- anomalies found:
  1.
  2.

## Notes
- top 3 anomalies observed:
1.
2.
3.
```

---

### Phase 1 - Rename Transition Helper and Freeze Contract
Status: [x] Completed

Objective:
- Make transition ownership explicit and future-proof.

Tasks:
1. Rename `MatchActionResolutionHelper` to `MatchActionTransitionHelper`:
   - helper file/class
   - interface file/type names
   - module providers/imports
2. Define transition contract as deterministic (no random, no narrative):
   - input: `context + action + actionOutcomeCode (+ duel flags if needed)`
   - output: `nextZone`, `nextPossession`, `nextEventType`
3. Mark this helper as the **single transition source of truth** in docs and code comments.

Acceptance:
- Transition helper renamed everywhere.
- Contract clearly states "pure transition matrix, no probabilistic decisions".

Sync notes:
- `MatchActionResolutionHelper` was replaced by `MatchActionTransitionHelper`.
- Transition contract exists and is implemented as pure transition logic in:
  - `src/match/helper/match-action-transition.helper.ts`
  - `src/match/interfaces/match-action-transition.interface.ts`

---

### Phase 2 - Centralize Transition Matrix (Pure Rules)
Status: [x] Completed

Objective:
- Ensure all turn state changes come from one explicit matrix.

Tasks:
1. Implement/normalize matrix by:
   - `action`
   - `zone`
   - `possession`
   - `actionOutcomeCode`
2. Keep set-piece and last-play exceptions explicit and traceable.
3. Guarantee action pool rule:
   - if `possession = USER` and `zone in {ATTACK_THIRD, BOX}`, options must include `SHOOT`.
4. Remove ad-hoc transition decisions from other helpers.

Acceptance:
- Zone/possession/event transitions can be traced to one helper only.
- No ambiguous transition branches in pipeline/outcome code.

Sync notes:
- Transition matrix helper is now the single source for regular turn transitions.
- `MatchDuelHelper` delegates zone/possession transition decisions to `MatchActionTransitionHelper`.
- Local transition methods were removed from duel helper:
  - `resolveNextZoneForPass`
  - `resolveDribbleProgressZone`
  - `resolveTurnoverZone`
- Pipeline fallback merge was removed in regular turns:
  - `nextZone/nextPossession/nextEventType` are applied directly from transition resolution.
- Verified with guardrails:
  - `test:action-transition`
  - `test:turn-flow-state-alignment`
  - `test:turn-coherence`

---

### Phase 3 - Introduce MatchActionOutcomeHelper Contract
Status: [x] Completed

Objective:
- Merge action resolution and outcome logic under one explicit contract.

Tasks:
1. Create `MatchActionOutcomeHelper` (or finish migration if partially present) with:
   - `resolveActionOutcome(...)`
2. Contract result must include:
   - `nextZone`
   - `nextPossession`
   - `nextEventType`
   - `actingPlayer`
   - `incidents`
   - `isGoal`
   - `actionOutcomeCode`
3. Outcome helper responsibilities:
   - resolve duel and probabilities
   - resolve incidents
   - delegate transition to `MatchActionTransitionHelper` exactly once

Acceptance:
- One action outcome method returns all state changes needed by engine.
- Transition helper called once per action resolution path.

Sync notes:
- `MatchActionOutcomeHelper` exists and is used by turn pipeline.
- Contract hardening applied:
  - `MatchActionOutcomeResult` now requires:
    - `actionOutcome`
    - `nextZone`
    - `nextPossession`
    - `nextEventType`
    - `actingPlayer`
    - `incidents`
  - `MatchActionOutcomeHelper` now builds normalized outcome payloads via `buildOutcome(...)`.
  - transition fallback values are delegated through `MatchActionTransitionHelper` from inside outcome helper when needed.
- Structured incidents were completed end-to-end for key turn side effects:
  - `PENALTY_SAVE` incident now includes structured metadata:
    - `eventType`, `zone`, `possession`, `teamId`, `teamName`, `playerName`, `messageKey`, `messageParams`.
  - `OPEN_PLAY_RESTART` incident now includes structured metadata:
    - `eventType`, `zone`, `possession`, `teamId`, `teamName`, `action`, `messageKey`, `messageParams`.
- Pipeline consumption was aligned to incident contract:
  - non-goal penalty-save narrative now reads `PENALTY_SAVE` from outcome incidents.
  - open-play restart branch now reads `OPEN_PLAY_RESTART` from outcome incidents and applies restart from payload.
- New regression coverage:
  - `scripts/tests/match-action-outcome-incidents.spec.ts`
  - `npm run -s test:action-outcome-incidents` ✅

---

### Phase 4 - Migrate Open-Play Flow End-to-End
Status: [x] Completed

Objective:
- Route regular turn flow through a single deterministic pipeline.

Tasks:
1. Move open-play actions (`PASS`, `LONG_PASS`, `DRIBBLE`, `SHOOT`, defensive actions) to `resolveActionOutcome(...)`.
2. Remove duplicated transition logic from:
   - `MatchPlayTurnPipelineHelper`
   - legacy branches in turn outcome flow
3. Preserve behavior parity where intended; remove contradictory branches.

Implementation scope (files to touch in this phase):
- `src/match/helper/match-play-turn-pipeline.helper.ts`
  - remove duplicated transition/restart branches and consume outcome payload as single source.
- `src/match/helper/match-action-outcome.helper.ts`
  - own full open-play sequence (`ACTION -> DUEL -> OUTCOME -> TRANSITION`) and return normalized turn state.
- `src/match/helper/match-duel.helper.ts`
  - keep duel/probability resolution only; no direct global match state mutation.
- `src/match/helper/match-turn-flow.helper.ts`
  - keep flow utilities only and remove transition ownership for open-play paths.
- `src/match/helper/match-turn-orchestrator.helper.ts`
  - centralize restart descriptors used by open-play incidents.
- `src/match/helper/match-player-selection.helper.ts`
  - align carrier/receiver selection with destination-zone context to improve narrative continuity.
- `src/match/interfaces/match-action-outcome.interface.ts`
  - harden outcome contract so pipeline does not recompute transition fields.

Guardrails/tests to update with these changes:
- `scripts/tests/match-runtime-transition-parity.spec.ts`
- `scripts/tests/match-pipeline-transition-precedence.spec.ts`
- `scripts/tests/match-zone-receiver-coherence.spec.ts`
- `scripts/tests/match-turn-coherence.spec.ts`

Acceptance:
- Open-play uses only:
  - `ACTION -> DUEL -> OUTCOME -> TRANSITION`.
- No second transition re-evaluation in pipeline.

Sync notes:
- Open-play actions are already routed through `MatchActionOutcomeHelper`.
- `MatchPlayTurnPipelineHelper` regular transition now trusts outcome payload directly:
  - removed runtime recomputation merge (`turnOutcome + transition fallback`) from `applyOutcomeTransition`.
  - runtime now applies:
    - `nextPossession`
    - `nextZone`
    - `nextEventType`
    - `actingPlayer` (fallback only if carrier mismatch).
- Added guardrail parity checks:
  - `scripts/tests/match-pipeline-transition-precedence.spec.ts`
  - `scripts/tests/match-runtime-transition-parity.spec.ts`
- Open-play restart decision is now fully owned by outcome-path helper chain:
  - new helper: `MatchOpenPlayRestartHelper`
  - `MatchActionOutcomeHelper` now resolves `OPEN_PLAY_RESTART` incidents via `MatchOpenPlayRestartHelper`
  - `MatchPlayTurnPipelineHelper` consumes restart incidents without recomputing open-play restart decisions
  - `MatchTurnFlowHelper` no longer owns open-play restart decision methods
  - tests updated and passing:
    - `test:action-outcome-incidents`
    - `test:pipeline-transition-precedence`
    - `test:runtime-transition-parity`
    - `test:zone-receiver-coherence`
    - `test:turn-coherence`
- Additional coherence fix (2026-05-07):
  - `applyOutcomeTransition(...)` now always syncs runtime carrier from `turnOutcome`, even when possession side does not change.
  - Fallback carrier is only used when outcome carrier is invalid for the resulting side roster.
  - Open-play restart incident generation now uses **post-outcome turn context** (`nextPossession/nextZone/nextEventType/actingPlayer`) instead of pre-outcome context.
  - Acting-team `BOX` context selection now prioritizes `FW/MF` and falls back to `DF/GK` only if no attacking profiles are available.
  - Guardrails added/updated:
    - `scripts/tests/match-pipeline-transition-precedence.spec.ts`
    - `scripts/tests/match-action-outcome-incidents.spec.ts`
    - `scripts/tests/match-zone-receiver-coherence.spec.ts`
  - Validation run:
    - `npm run -s build`
    - `npm run -s test:pipeline-transition-precedence`
    - `npm run -s test:action-outcome-incidents`
    - `npm run -s test:zone-receiver-coherence`
    - `npm run -s test:runtime-transition-parity`
    - `npm run -s test:turn-flow-state-alignment`
    - `npm run -s test:turn-coherence`
    - `npm run -s test:all-actions-carrier-coherence`
    - `npm run -s test:pass-zone-context-selection`

Validation notes (scope clarification):
- `MatchDuelHelper` is now isolated as duel/probability resolver and does not mutate global match state.
- `MatchActionOutcomeResult` contract already returns runtime-final transition fields used by pipeline:
  - `nextZone`, `nextPossession`, `nextEventType`, `actingPlayer`, `incidents`.
- Guardrail tests for runtime/pipeline transition precedence are implemented and passing.

Still not fully consolidated (tracked as pending in later phases):
- Restart descriptor ownership is still split by context:
  - `resolveCardRestartDescriptor(...)` and `resolveOpenPlayRestartDescriptor(...)` both exist in `MatchTurnOrchestratorHelper`.
  - Functional behavior is correct, but full descriptor unification remains a cleanup target.
- Advanced receiver-coherence is applied in open-play pass flow (destination-zone pool) but not as a single universal policy for every branch/event family.

#### Detailed Rules Agreed (to preserve in next iterations)

This section documents the exact gameplay/narrative rules agreed during refactor review.  
These rules are the reference when implementing pending Phase 5/6/8 tasks.

Open-play transition rules:
- `PASS`:
  - success: keep possession in same zone **or** progress to next zone.
  - failure: turnover in same zone **or** next zone.
- `LONG_PASS`:
  - success: progress to a forward zone (never same zone).
  - failure: turnover in an advanced zone (not same-zone stall).
- `DRIBBLE`:
  - success: progress to next zone.
  - failure: turnover in same zone or contested nearby zone.
- `SHOOT`:
  - can end in goal, save/blocked miss, or rebound in same area.
  - rebound may be recovered by either side.
- Defensive actions (`DEFEND`, `PRESS`, `TACKLE`, `BLOCK`):
  - resolve in local zone context.
  - success/failure must not bypass directly to unrealistic scoring outcomes.

Receiver/carrier coherence rules:
- Narrative actor who executes action `N` must be coherent with `actingPlayer` for turn `N`.
- If action is a successful pass sequence, next carrier for turn `N+1` must come from destination-zone pool:
  - attacking side: `teammatesInZone`
  - defending side (after turnover): `opponentsInZone`
- Context side and carrier side must always align:
  - `possession = USER` => carrier from user team
  - `possession = OPPONENT` => carrier from opponent team

Set-piece and special-event coherence:
- Corner, free kick, throw-in, and penalty flows must use explicit restart descriptors from a single source.
- Penalty and last-play penalty must always narrate:
  - taker from attacking side
  - goalkeeper from defending side
- No duplicated executor lines for a single last-play sequence.

Test coverage expected from these rules:
- transition matrix parity tests per action/zone/outcome.
- runtime pipeline precedence tests (single transition owner).
- zone receiver coherence tests (destination-zone carrier selection).
- last-play goalkeeper coherence tests.
- full turn coherence tests (possession/event/carrier alignment).

---

### Phase 5 - Set Pieces and Penalties Through the Same Contract
Status: [x] Completed

Objective:
- Eliminate split logic for penalty/free-kick/corner/throw-in resolution.

Agreed implementation plan (pre-code):
1. Create dedicated penalty helper:
   - add `match-penalty-resolution.helper.ts`
   - add `match-penalty-resolution.helper.interface.ts`
   - helper owns:
     - penalty award pending state
     - penalty execution turn
     - penalty outcome (`goal/save/miss`) and incidents
2. Keep `MatchActionOutcomeHelper` as orchestrator:
   - delegate penalty logic to penalty helper
   - remove duplicated/recomputed penalty/restart branches
3. Unify restart descriptor in one place:
   - consolidate card/open-play descriptor resolution in orchestrator helper
   - avoid descriptor drift by path
4. Simplify turn pipeline:
   - no local penalty/restart business logic
   - pipeline only applies normalized outcome payload + incidents
5. Enforce penalty turn separation:
   - Turn `N`: foul awarded -> context set to `PENALTY_FOR_EVENT`/`PENALTY_AGAINST_EVENT`
   - Turn `N+1`: user chooses option and penalty is resolved
6. Mandatory tests:
   - extend `match-action-outcome-incidents.spec.ts`
   - add penalty two-turn separation test
   - add unified restart-descriptor test
   - revalidate last-play penalty goalkeeper coherence test
   - run full coherence regression suite
7. Phase doc sync:
   - update this file with final scope/results and mark phase completion when done
8. Done criteria:
   - no same-turn auto-resolution after penalty award
   - no duplicated restart/penalty resolution path
   - all guardrail/coherence tests green

Tasks:
1. Move set-piece and penalty resolution to `resolveActionOutcome(...)`.
2. Ensure penalty flow is not auto-resolved before user action.
3. Keep restart descriptors centralized and consistent.

Acceptance:
- Set pieces and penalties produce coherent actor/outcome/next context.
- No duplicate penalty resolution path.

Sync notes:
- Implemented:
  - dedicated `MatchPenaltyResolutionHelper` + interface contract.
  - explicit `PENALTY_AWARDED` incident type for turn separation.
  - `MatchActionOutcomeHelper` delegates penalty award/save incident construction to penalty helper.
  - `MatchPlayTurnPipelineHelper` no longer keeps duplicated local penalty-award branches.
  - restart descriptor path unified through `MatchTurnOrchestratorHelper`.
- Validation:
  - build ✅
  - `test:action-outcome-incidents` ✅
  - `test:turn-outcome-guardrails` ✅
  - `test:recovery-role-coherence` ✅
  - `test:pass-zone-context-selection` ✅
  - `test:all-actions-carrier-coherence` ✅
  - coherence guardrails suite re-run ✅

---

### Phase 6 - Last-Play Coherence
Status: [x] Completed

Objective:
- Remove multi-executor inconsistencies in final-turn scenarios.

Tasks:
1. Route `LAST_PLAY_*` branches through the same action outcome contract.
2. Guarantee one coherent executor per narrative sequence.
3. Ensure final outcome matches persisted context and scoreboard.

Acceptance:
- No duplicated last-play executors/messages.
- Last-play transitions align with context and final score.

Phase completion checklist:
- [x] Route `LAST_PLAY_*` through `resolveActionOutcome(...)`.
- [x] Keep a single coherent executor/outcome path for last-play.
- [x] Persist and return final `END` context without drift.

Sync notes:
- Last-play branch is now routed through the same action-outcome contract path used by open-play:
  - `MatchPlayTurnPipelineHelper.resolveLastPlayTurn(...)` delegates to
    `matchActionOutcomeHelper.resolveActionOutcome(...)`.
  - `MatchActionOutcomeHelper` handles `LAST_PLAY_*` through `resolveLastPlayOutcome(...)`.
- Single-executor coherence improved by consolidating final outcome and carrier selection into one contract result.
- Final closure context coherence maintained with explicit `END` mapping and persisted `lastContextJson`.
- Validation:
  - `npm run -s test:last-play-penalty-goalkeeper` ✅
  - `npm run -s test:turn-coherence` ✅
  - `npm run -s test:action-outcome-incidents` ✅
  - `npm run -s test:turn-flow-state-alignment` ✅
  - `npm run -s test:pipeline-transition-precedence` ✅
  - `npm run -s test:runtime-transition-parity` ✅

#### Last-Play END Context Desync (Detailed)

Symptom detected in massive runs:
- `after.eventType = END` while `context.applied.eventType = LAST_PLAY_*`
- `after.possession != context.applied.possession` in final turn logs
- Concentrated in `LAST_PLAY_* -> END` closure turns.

Root cause:
- In `resolveLastPlayTurn`, match state was persisted as finished (`END`) but response mapping was returned
  without rebuilding/passing a final `currentContext`.
- `MatchResponseMapperHelper` then fell back to previously persisted `lastContextJson`, which still represented the
  pre-closure last-play context.

Fix strategy:
1. After computing last-play outcome and setting `match.eventType = END`, build final response context explicitly via
   `matchTurnFlowHelper.buildResponseContext(...)` using:
   - event: `END`
   - options: `[]`
   - `isPendingSetPiece: false`
   - `lastAction: selectedAction`
   - `lastOutcome: responseHeadline`
2. Persist that final context to `match.lastContextJson`.
3. Record end-turn context (`phase: END`) for auditability.
4. Return response with explicit `currentContext` to avoid mapper fallback drift.

Expected post-fix behavior:
- For last-play finalization turns, `response.currentContext` reflects `END`.
- `response.possession` and `response.currentContext.possession` remain aligned.
- Massive-run `contextMismatch` should no longer include `LAST_PLAY_* -> END` desync cases.

Validation evidence (after fix):
- Unit tests:
  - `npm run -s test:last-play-penalty-goalkeeper` ✅
  - `npm run -s test:turn-coherence` ✅
- Massive run:
  - command: `node ./scripts/tests/run-random-finals.mjs 100`
  - report:
    - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-06T04-27-44-735Z.json`
  - audit result:
    - `mismatch = 0`
    - `mismatch_last_play = 0`

Execution note:
- Implemented and pushed on `main` in commit `1aba898` (2026-05-06).
- Scope closed for this fix:
  - explicit `END` context mapping after last-play closure
  - persisted final `lastContextJson` coherence
  - regression coverage for last-play penalty goalkeeper flow

---

### Phase 7 - Engine/Service Cleanup (Lean Orchestration)
Status: [x] Completed

Objective:
- Keep architecture extensible without turning engine/service into monoliths.

Tasks:
1. `MatchEngine` orchestrates only:
   - `PREPARE -> ACTION_OUTCOME -> DISCIPLINE/RESTART -> POST_TURN -> RESPONSE`
2. `MatchService` remains facade only:
   - validate/load/delegate/respond
3. Remove dead/duplicated methods and constants from service/pipeline.

Acceptance:
- `MatchService` has no turn business rules.
- `MatchEngine` coordinates helpers, does not implement heavy gameplay rules.

Sync notes:
- `MatchService.play` and `MatchService.startFinal` delegate directly to `MatchEngine`.
- `MatchEngine` is lightweight and stage-driven.
- Completed in this iteration:
  - Special-event turn resolution moved out of pipeline:
    - new helper: `MatchPlaySpecialEventResponseHelper`
    - `MatchPlaySpecialEventsHelper` now delegates `QUIT_MATCH`, `HALF_TIME_EVENT`, and `LAST_PLAY_*` to this helper.
  - Stage flow is now truly layered in runtime path:
    - `MatchEngine.play(...)` executes `prepare -> special-events -> pipeline -> post-turn -> response`.
    - `MatchPlayTurnPipelineHelper.apply(...)` returns staged context (no direct response build).
    - `MatchPlayPostTurnHelper.apply(...)` is active and applies squad/coaching/post-turn effects.
    - `MatchPlayResponseHelper.build(...)` no longer uses bypass return from prebuilt `context.response`.
  - DI wiring completed:
    - `MatchPlaySpecialEventResponseHelper` added to `MatchModule` providers.
    - `MatchTurnOutputHelper` added to `MatchModule` providers.
  - Compatibility wrapper removed:
    - deleted `MatchPlayTurnPipelineHelper.playTurn(...)` legacy entrypoint.
    - `MatchPlayTurnPipelineContract` now exposes only stage-based `apply(...)`.
  - Turn-output finalization unified:
    - `MatchPlaySpecialEventResponseHelper` now uses `MatchTurnOutputHelper.finalizeTurnOutput(...)`.
    - removed duplicated methods from special-event helper:
      - `finalizeTurnOutput(...)`
      - `assignChronologicalMinutes(...)`
      - `localizeMessageItems(...)`
  - Test alignment after extraction:
    - `match-last-play-penalty-goalkeeper.spec.ts` updated to use special-event response helper for last-play resolution path.
  - Validation (all green):
    - `npm run -s build`
    - `npm run -s test:last-play-penalty-goalkeeper`
    - `npm run -s test:turn-flow-state-alignment`
    - `npm run -s test:pipeline-transition-precedence`
    - `npm run -s test:runtime-transition-parity`
    - `npm run -s test:turn-coherence`
    - `npm run -s test:action-outcome-incidents`
    - `npm run -s test:zone-receiver-coherence`
    - `npm run -s test:pass-zone-context-selection`
    - `npm run -s test:all-actions-carrier-coherence`
- Closure note:
  - Phase 7 legacy cleanup is complete for runtime orchestration and special-event output shaping.

---

### Phase 8 - Narrative Normalization by Real Outcome
Status: [x] Completed

Objective:
- Make narrative strictly reflect the actual resolved outcome.

Short implementation plan (to close Phase 8):
1. Remove remaining legacy/fallback narrative branches in regular turns:
   - regular non-goal messages must be resolved from `actionOutcomeCode` + resolved actor side.
   - keep one neutral fallback key only for unexpected states.
2. Enforce actor continuity in open-play narration:
   - next turn actor must be the resolved carrier from previous outcome.
   - no carrier re-pick in pipeline when outcome already resolved a valid player.
3. Normalize perspective messages by source possession and resolved result:
   - possession consequence keys (`keeps/recover/interception`) must use pre-resolution possession and post-resolution ownership.
   - avoid “user action narrated as rival executor” drift.
4. Unify narrative composition across all branches:
   - open play non-goal
   - restart incidents
   - penalty incidents
   - last-play outcome
   must pass through the same turn-message composition path.
5. Lock with guardrails:
   - add integration tests for `PASS`/`LONG_PASS` actor continuity in real pipeline play.
   - extend coherence tests for perspective alignment in offensive and defensive turns.
6. Validate with massive run:
   - run 100 finals and record residual narrative incoherences in this document before closing Phase 8.

Tasks:
1. Drive message keys from `actionOutcomeCode` and resolved actor.
2. Remove generic/fallback contradictory lines.
3. Add perspective guardrails:
   - user-selected action starts with user actor when applicable
   - rival action narration only when resolved actor side is rival.

Acceptance:
- No "user chose action but rival narrated as executor" inconsistencies in audited samples.

Sync notes:
- Narrative quality improved (more specific outcomes, reduced generic contradictions).
- Still pending:
  - fully eliminate perspective drift cases detected in manual audits
  - normalize all branches to be outcome-code-driven

#### Phase 8 - Code Survey (2026-05-08)

Current hotspots to address before implementation:

1. Outcome-driven narrative is still mixed with generic fallbacks:
   - `match-play-turn-pipeline.helper.ts` builds non-goal result keys with fallback (`match.turn.userNoFinish`, `match.turn.userDefenseHolds`) after `resolveActionOutcome(...)`.
   - This can still produce contradictory text when the resolved actor/possession differs from simplistic fallback assumptions.

2. Possession consequence message is computed with post-turn possession as input:
   - In regular turn flow, `pushPossessionConsequenceMessage(...)` currently receives `possessionAfterTurn`.
   - The helper semantics are source-possession based; this can blur “keeps ball / recovers / interception” narratives.

3. Actor continuity requires stricter outcome ownership:
   - `match-action-outcome.helper.ts` resolves `actingPlayer` from outcome carrier, but pipeline fallbacks can still reshape interpretation.
   - Narrative resolution should consume a single normalized actor payload per turn branch.

4. Branch parity is incomplete across regular vs incident-driven paths:
   - Penalty/restart incident branches already use `messageKey`, but non-goal open-play path still has fallback composition logic in pipeline.
   - Need one narrative resolution path for:
     - open play outcomes
     - card/restart incidents
     - penalty incidents
     - no-incident non-goal outcomes

5. Outcome-to-message mapping should be explicit and centralized:
   - Map by `actionOutcomeCode` (+ perspective + possession delta) in one helper/module.
   - Avoid branch-local ad-hoc key selection.

#### Phase 8 - Implementation Batch (2026-05-08)

Applied in this batch:

1. Non-goal fallback key normalization in pipeline:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - changed fallback from mixed legacy keys:
     - `match.turn.userNoFinish`
     - `match.turn.userDefenseHolds`
   - to neutral outcome fallback:
     - `match.turn.result.outcome.NOT_HANDLED.1`
   - intent: avoid contradictory text when fallback is hit in non-goal branches.

2. Outcome-driven key resolution extended to `NOT_HANDLED`:
   - file: `src/match/helper/match-narrative-variant.helper.ts`
   - `resolveTurnResultKey(...)` now tries `match.turn.result.outcome.<OUTCOME>.<N>`
     for every defined `actionOutcome`, including `NOT_HANDLED`.
   - intent: reduce branch-local action/fail assumptions and keep copy aligned with resolved outcome.

3. Possession consequence semantics fixed to source possession:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - `pushPossessionConsequenceMessage(...)` in regular non-card path now uses source turn possession
     (pre-resolution), not post-turn possession.
   - intent: message keys (`userKeepsBall`, `userRecoversBall`, `opponentInterception`, `opponentKeepsBall`)
     reflect who started the duel phase and what happened after resolution.

Validation to run for this batch:
- `npm run -s build`
- `npm run -s test:turn-flow-state-alignment`
- `npm run -s test:turn-coherence`
- `npm run -s test:runtime-transition-parity`
- `npm run -s test:pipeline-transition-precedence`
- `npm run -s test:action-outcome-incidents`

#### Phase 8 - Implementation Batch (2026-05-09) - Steps 1+2

Applied in this batch:

1. Remove remaining legacy result fallback in regular non-goal branch:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - regular non-goal key resolution now forces outcome-driven lookup:
     - `resolveTurnResultKey(null, turnOutcome.actionOutcome, false, 'match.turn.result.outcome.NOT_HANDLED.1')`
   - this prevents fallback to legacy `success/fail + action` variants in normal runtime.

2. Enforce carrier continuity from resolved outcome:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - `applyOutcomeTransition(...)` now treats `nextPossession` as source of truth for side ownership.
   - no cross-side carrier adoption from stale `ballCarrierTeamId`.
   - carrier resolution order:
     - `turnOutcome.actingPlayer` (same-side roster)
     - `turnOutcome.ballCarrierName` (same-side roster)
     - deterministic fallback pick from resulting side roster.

3. Guard against cross-team acting-player drift in response context:
   - file: `src/match/helper/match-turn-flow.helper.ts`
   - `resolveActingPlayerFromMatchState(...)` no longer cross-picks from the rival roster by carrier name.
   - if carrier name is invalid for possession side, it falls back to that side roster.

4. Tests updated:
   - `scripts/tests/match-pipeline-transition-precedence.spec.ts`
     - updated expectations to enforce `nextPossession` precedence over stale carrier team id.
     - added cross-side invalid-name guardrail case.
   - `scripts/tests/match-turn-flow-state-alignment.spec.ts`
     - added acting-player side coherence case when carrier name belongs to rival roster.
   - `scripts/tests/match-play-pass-longpass-continuity.integration.spec.ts`
     - follow-up continuity assertions now distinguish:
       - user possession: actor continuity by name
       - opponent possession: defensive narration must still be from user team.

Validation:
- `npm run -s build` ✅
- `npm run -s test:pipeline-transition-precedence` ✅
- `npm run -s test:turn-flow-state-alignment` ✅
- `npm run -s test:play-pass-longpass-continuity` ✅

#### Phase 8 - Implementation Batch (2026-05-09) - Steps 3 + 5 + 6

Applied in this batch:

1. Possession consequence key now uses source + resolved ownership:
   - files:
     - `src/match/interfaces/match-turn-message-accumulator.interface.ts`
     - `src/match/helper/match-turn-message.helper.ts`
     - `src/match/helper/match-play-turn-pipeline.helper.ts`
   - `pushPossessionConsequenceMessage(...)` now receives:
     - source possession (pre-resolution)
     - resolved possession (post-resolution)
   - consequence key selection (`userKeepsBall`, `userRecoversBall`, `opponentInterception`, `opponentKeepsBall`)
     is derived from `(sourcePossession, resolvedPossession)` pair.

2. Guardrail integration test extended for defensive perspective:
   - file: `scripts/tests/match-play-pass-longpass-continuity.integration.spec.ts`
   - added runtime scenario:
     - `context.before.possession = OPPONENT`
     - user selects defensive action (`PRESS | DEFEND | BLOCK | TACKLE`)
     - validates first context/action narration remains from user team perspective.
   - made follow-up assertion robust when transition goes through halftime restart.

3. Massive validation run executed (100 finals):
   - command: `node ./scripts/tests/run-random-finals.mjs 100`
   - report:
     - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-09T06-49-11-926Z.json`
   - aggregate snapshot:
     - `totalShotsByUser = 80`
     - `totalShotsUserGoal = 47`
     - `totalShotsUserConcede = 2`
     - `totalDefensiveActions = 419`
     - `totalDefensiveConcede = 0`
     - `totalCounterGoalMessages = 0`
     - `totalPenaltyResolvedSameTurn = 0`
     - `totalRivalryTriggers = 9`
     - `totalTurnsWithContext = 1158`
     - `totalTurns = 1158`
     - `averageTurns = 11.58`

4. Validation commands for this batch:
   - `npm run -s build` ✅
   - `npm run -s test:turn-coherence` ✅
   - `npm run -s test:play-pass-longpass-continuity` ✅
   - `npm run -s test:pipeline-transition-precedence` ✅
   - `npm run -s test:runtime-transition-parity` ✅

Pending to close Phase 8:
- Step 4 remains open in strict form:
  - unify open-play / restart incidents / penalty incidents / last-play narrative composition through one explicit composition path (single entrypoint for branch-level message key selection).
- one final 100-finals coherence pass after that unification.

#### Phase 8 - Implementation Batch (2026-05-09) - Step 4 + Final 100 Run

Applied in this batch:

1. Added centralized outcome-message resolver helper:
   - files:
     - `src/match/interfaces/match-outcome-message.interface.ts`
     - `src/match/helper/match-outcome-message.helper.ts`
   - helper now resolves branch-level message descriptor (`type/key/params/metadata/timelineMessageEn`) for:
     - goal outcomes
     - non-goal outcomes
     - penalty-awarded incidents
     - penalty-save incidents
     - last-play attack/counter outcome keys

2. Pipeline regular non-goal/goal messaging now delegates to centralized resolver:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - removed duplicated branch-local message-key composition for regular non-goal paths.

3. Last-play response path now uses the same outcome-message resolver:
   - file: `src/match/helper/match-play-special-event-response.helper.ts`
   - selected-action message in last-play now preserves user perspective in `*_AGAINST` scenarios.

4. Carrier-context coherence hardening in turn-flow response context:
   - file: `src/match/helper/match-turn-flow.helper.ts`
   - if carrier name belongs to opposite side, context now falls back to possession-side roster.
   - if carrier name is unknown on both sides, context preserves carrier identity via fallback player.

5. Test/harness updates:
   - file: `scripts/tests/match-last-play-penalty-goalkeeper.spec.ts`
   - updated harness for `MatchPlaySpecialEventResponseHelper` new outcome-message dependency.

Validation:
- `npm run -s build` ✅
- `npm run -s test:play-pass-longpass-continuity` ✅
- `npm run -s test:all-actions-carrier-coherence` ✅
- `npm run -s test:response-context-carrier-alignment` ✅
- `npm run -s test:turn-flow-state-alignment` ✅
- `npm run -s test:pipeline-transition-precedence` ✅
- `npm run -s test:runtime-transition-parity` ✅
- `npm run -s test:turn-coherence` ✅
- `npm run -s test:zone-receiver-coherence` ✅
- `npm run -s test:pass-zone-context-selection` ✅
- `npm run -s test:last-play-penalty-goalkeeper` ✅
- `node ./scripts/tests/run-random-finals.mjs 100` ✅

Final 100-run report for this batch:
- `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-09T16-34-23-396Z.json`
- aggregate:
  - `totalShotsByUser = 62`
  - `totalShotsUserGoal = 37`
  - `totalShotsUserConcede = 3`
  - `totalDefensiveActions = 409`
  - `totalDefensiveConcede = 0`
  - `totalCounterGoalMessages = 0`
  - `totalPenaltyResolvedSameTurn = 0`
  - `totalRivalryTriggers = 2`
  - `totalTurnsWithContext = 1164`
  - `totalTurns = 1164`
  - `averageTurns = 11.64`

#### Phase 8 - Final Closure Batch (`OPEN_PLAY_RESTART` unified path)

Applied in this batch:
1. Extended centralized descriptor helper for restart incidents:
   - files:
     - `src/match/interfaces/match-outcome-message.interface.ts`
     - `src/match/helper/match-outcome-message.helper.ts`
   - added `resolveRestartMessage(...)` + `ResolveRestartOutcomeMessageParams`.
2. Replaced pipeline-local restart message composition:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - `applyOpenPlayRestartFromIncident(...)` now resolves restart descriptor via `MatchOutcomeMessageHelper`.
   - removed direct branch-local `pushTurnMessage` key/params composition for open-play restart.
3. Restart stat persistence now uses centralized descriptor payload:
   - persisted `message`, `messageKey`, and `messageParams` are aligned with centralized resolver output.

Validation:
- `npm run -s build` ✅
- `npm run -s test:action-outcome-incidents` ✅
- `npm run -s test:pipeline-transition-precedence` ✅
- `npm run -s test:turn-coherence` ✅
- `npm run -s test:runtime-transition-parity` ✅

Done criteria:
- `OPEN_PLAY_RESTART` message composition no longer exists as branch-local text logic in pipeline.
- all four narrative families use centralized descriptor flow.

---

### Phase 9 - Testing and Coherence Guardrails
Status: [x] Completed

Objective:
- Lock behavior with deterministic coverage before large-scale calibration.

Tasks:
1. Unit tests for transition matrix:
   - action + zone + possession + outcome -> next state
2. Coherence tests:
   - actor perspective
   - halftime context alignment
   - penalty flow
   - last-play single executor
3. Keep/extend:
   - `match-options-matrix`
   - turn coherence / context persistence / guardrails scripts

Acceptance:
- All coherence and matrix tests pass consistently.
- Regressions fail fast with explicit assertions.

Sync notes:
- Coherence guardrail tests are in place under `scripts/tests`, including:
  - options matrix
  - turn coherence/context persistence
  - transition and outcome guardrails
  - last-play goalkeeper coherence
  - receiver/zone and recovery-role coherence

---

### Phase 10 - Massive QA and Calibration Loop
Status: [x] Completed

Objective:
- Validate behavior quality in bulk and tune from evidence.

Execution Plan:
1. Freeze release-candidate start point:
   - use current `main` HEAD as `Run A` baseline for this phase.
   - avoid architectural changes during the loop; only calibration knobs are allowed.
2. Execute `Run A` (100 random finals):
   - command: `node ./scripts/tests/run-random-finals.mjs 100`
   - store JSON report path in this section.
3. Build `Run A` KPI snapshot table:
   - `totalShotsByUser`
   - `totalShotsUserGoal`
   - `totalShotsUserConcede`
   - `totalDefensiveActions`
   - `totalDefensiveConcede`
   - `totalCounterGoalMessages`
   - `totalPenaltyResolvedSameTurn`
   - `totalRivalryTriggers`
   - `totalTurnsWithContext`
   - `totalTurns`
   - `averageTurns`
4. Coherence audit from evidence:
   - sample narrative review for actor continuity, possession/action coherence, restart/penalty/last-play sequencing.
   - detect anomalies by frequency from JSON aggregate + targeted per-match traces.
5. Apply minimal calibration batch:
   - adjust only documented probability coefficients.
   - max 2-3 coefficient groups per iteration.
   - no helper orchestration refactors in this phase.
6. Execute `Run B` (100 random finals):
   - command: `node ./scripts/tests/run-random-finals.mjs 100`
   - store report path and compute delta vs Run A.
7. Decide closure:
   - if KPIs/coherence pass thresholds, close Phase 10.
   - otherwise run one additional small calibration iteration (Run C) and repeat delta table.

Run Artifacts:
- Run A report: `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-09T18-55-31-140Z.json`
- Run B report: `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-10T23-22-44-860Z.json`
- Optional Run C report: _not required for closure_

Delta Table (Run B vs Run A):
- userShotGoalRate: `0.5616 - 0.5634 = -0.0017`
- userShotConcedeRate: `0.0274 - 0.0423 = -0.0149`
- defensiveConcedeRate: `0.0000 - 0.0000 = +0.0000`
- counterGoalPerMatch: `0.0000 - 0.0100 = -0.0100`
- penaltyResolvedSameTurnRate: `0.0000 - 0.0000 = +0.0000`
- rivalryTriggersPerMatch: `0.0400 - 0.0400 = +0.0000`
- contextCoverage: `1.0000 - 1.0000 = +0.0000`
- averageTurns: `11.62 - 11.60 = +0.02`

Calibration Guardrails:
- All phase-9 guardrail tests must remain green after each calibration batch.
- Any regression in coherence tests blocks closure.
- Changes must be traceable to one documented calibration batch.

Acceptance:
- Measurable coherence improvement vs baseline.
- No major gameplay regression in smoke/e2e.
- Run A/Run B delta section completed with explicit conclusion.

Release Sign-off Thresholds:
- zero critical coherence defects in sampled narratives:
  - no user/rival perspective inversion on selected action.
  - no impossible possession/action menu mismatch.
  - no duplicated/conflicting last-play executor sequence.
- guardrail suites all green:
  - `test:turn-coherence`
  - `test:runtime-transition-parity`
  - `test:pipeline-transition-precedence`
  - `test:action-outcome-incidents`
  - `test:play-pass-longpass-continuity`
- gameplay balance remains inside expected envelope from Run A/Run B comparison (no extreme drift in concede/goals from defensive actions).

Sync notes:
- Multiple `100`-match runs were executed and documented in this file with report paths.
- Probabilities were tuned based on evidence.
- Closure decision:
  - `Run C` was not required because Run B kept coherence guardrails green and KPI deltas stayed stable.
  - Phase 10 is accepted as completed with Run A/Run B evidence and guardrail pass status.

#### Phase 10 Kickoff (Run A)
- Status: Started
- Command:
  - `node ./scripts/tests/run-random-finals.mjs 100`
- Report path:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-09T18-55-31-140Z.json`
- Aggregate snapshot:
  - `totalShotsByUser = 71`
  - `totalShotsUserGoal = 40`
  - `totalShotsUserConcede = 3`
  - `totalDefensiveActions = 418`
  - `totalDefensiveConcede = 0`
  - `totalCounterGoalMessages = 1`
  - `totalPenaltyResolvedSameTurn = 0`
  - `totalRivalryTriggers = 4`
  - `totalTurnsWithContext = 1160`
  - `totalTurns = 1160`
  - `averageTurns = 11.6`
- Initial notes:
  - execution completed successfully and stored as baseline run for Phase 10 delta comparison.

#### Phase 10 - Run A Coherence Audit

Audit scope:
- perspective alignment (user/rival vs narrated actor)
- possession/action menu coherence in open-play events
- `SHOOT` presence in `BOX` for user open-play possession
- PASS/LONG_PASS transition behavior in open-play
- last-play single executor coherence
- carrier continuity across consecutive turns

Automated audit summary (Run A):
- turns analyzed: `1160`
- user perspective checks: `668`, failures: `0`
- defensive perspective checks (user defending): `418`, failures: `0`
- possession-menu checks (open-play): `634`, failures: `0`
- `BOX` + user possession + open-play checks: `89`, missing `SHOOT`: `0`
- PASS forward-rule checks (open-play, user keeps possession): `55`, violations: `2`
- LONG_PASS forward-rule checks (open-play, user keeps possession): `43`, violations: `4` (`3` same-zone)
- last-play executor checks: `59`, duplicated/conflicting executor: `0`
- carrier continuity checks (after->next before, excluding halftime/last-play/end): `900`, failures: `0` (rate `100%`)

Interpretation:
- No critical coherence defects were detected in Run A for perspective, menu coherence, last-play executor or carrier continuity.
- PASS/LONG_PASS violations are concentrated on boundary transitions into `HALF_TIME_EVENT` / `LAST_PLAY_*` and should be treated as transition-boundary exceptions, not core open-play flow defects.

Next action for Phase 10:
- Run B executed and delta table completed.
- Phase closed without Run C (metrics stable, no critical coherence regressions).

#### Phase 10 - Run B Snapshot

- Date: 2026-05-10
- Command:
  - `node ./scripts/tests/run-random-finals.mjs 100`
- Report path:
  - `/Users/mat/Repos/github/programacion_III_UTN_private/utn-utnito/course/tp/world-cup-api/scripts/tests/reports/random_100_matches_2026-05-10T23-22-44-860Z.json`
- Aggregate snapshot:
  - `totalShotsByUser = 73`
  - `totalShotsUserGoal = 41`
  - `totalShotsUserConcede = 2`
  - `totalDefensiveActions = 431`
  - `totalDefensiveConcede = 0`
  - `totalCounterGoalMessages = 0`
  - `totalPenaltyResolvedSameTurn = 0`
  - `totalRivalryTriggers = 4`
  - `totalTurnsWithContext = 1162`
  - `totalTurns = 1162`
  - `averageTurns = 11.62`

#### Phase 10 - Guardrail Status (post Run B)

Validation commands:
- `npm run -s test:turn-coherence` ✅
- `npm run -s test:runtime-transition-parity` ✅
- `npm run -s test:pipeline-transition-precedence` ✅
- `npm run -s test:action-outcome-incidents` ✅
- `npm run -s test:play-pass-longpass-continuity` ✅

Interim conclusion:
- No regression in core coherence guardrails after Run B.
- KPI drift vs Run A is minimal and favorable in concede-related metrics.
- Closure: Phase 10 accepted as complete with Run A + Run B and no Run C required.

---

### Phase 11 - Shared Base Helper Refactor
Status: [x] Completed

Objective:
- Reduce duplication across helpers after functional stabilization.

Tasks:
1. Create `MatchBaseHelper`.
2. Move shared utility logic:
   - language normalization/fallback
   - common guards/normalization
   - repeated message-param shaping
3. Refactor helpers to extend/use base helper where appropriate.

Acceptance:
- Shared utility code centralized.
- Concrete helpers remain focused on business logic.

Sync notes:
- Implemented:
  - `AbstractMatchBasicHelper`
  - `AbstractMatchI18nHelper`
- Multiple match helpers now extend shared base classes and reuse common language/random/utility behavior.

---

## Completion Checklist
- [x] Phase 0 baseline captured
- [x] Phase 1 rename + transition contract
- [x] Phase 2 pure transition matrix centralized
- [x] Phase 3 action outcome contract unified
- [x] Phase 4 open-play migrated end-to-end
- [x] Phase 5 set pieces and penalties migrated
- [x] Phase 6 last-play coherence stabilized
- [x] Phase 7 engine/service cleanup completed
- [x] Phase 8 narrative normalized by real outcome
- [x] Phase 9 coherence tests and guardrails finalized
- [x] Phase 10 mass QA and calibration completed
- [x] Phase 11 shared base helper refactor completed

---

## Post-Plan Final Steps (Release Readiness)

These items are outside the main refactor phases and serve as final release hardening:

1. Manual E2E critical path pass (frontend + backend)
   - validate kickoff, halftime menu, restart, last-play, penalties for/against, substitutions/injuries.
   - verify context panel coherence (zone/possession/carrier/event) against timeline.
2. Extended stability run
   - run larger random simulation batch (`200`/`500`) for final confidence.
   - compare against latest 100-match baseline and record drift.
3. Consolidated release report
   - summarize KPIs, coherence checks, guardrail suite status, and known limitations.
4. Stable release tag
   - cut final backend tag after report sign-off.
5. Pedagogical handoff
   - freeze engine behavior for student use.
   - document expected mechanics and edge cases in course-facing notes.

---

## Fine Tuning - Sector Player Rotation (Post-Refactor)

Context:
- The engine is stable, but in long matches the same players tend to appear repeatedly per sector.
- This hurts narrative freshness even when transition coherence is correct.

Goal:
- Keep coherence while increasing per-turn variety of actor/receiver candidates by zone.

Implementation details:
1. `MatchContextBuilderHelper.getPlayersByZone(...)` becomes formation-aware:
   - receives current formation (`teamFormation`/`opponentFormation`) and adapts zone quotas with a soft tactical bias.
   - keeps role guards per zone (defensive third, midfield, attack third, box) to avoid unrealistic role leakage.
2. Replace deterministic `top-N by skill` slices with weighted random sampling:
   - weighted by `skill + energy + action-relevant attribute` (attack/defense according to zone and side).
   - sampling without replacement inside each zone pool.
3. Add anti-repetition hint:
   - reduce weight for the recent acting player to avoid immediate re-selection loops when alternatives exist.
4. Preserve coherence constraints:
   - users still receive actions from valid pools.
   - receiver/player always belongs to the resolved destination-zone pool.

Validation tests to add:
- Zone pool variability test:
  - same input over many runs should produce multiple distinct candidate pools.
- Formation bias test:
  - attacking-heavy formations (example `4-2-4`) should include forwards in attack zones more often than defensive formations (example `5-4-1`).
- Anti-repetition test:
  - recent actor selection frequency should drop versus neutral players across repeated samples.

---

## Narrative Coverage & Rivalry Audit (300 Finals)

Status: [x] Completed

Objective:
- Measure real narrative coverage in Spanish (`es`) and close the gap between available i18n variants and actually emitted messages.
- Guarantee rivalry narrative consistency at match start and after goals in rivalry matches.

Execution plan:
1. Run `300` random finals and persist report.
2. Build frequency table from emitted timeline/messages (`es`) by:
   - `messageKey`
   - rendered text
   - action/event/zone/possession
3. Compare runtime usage against i18n inventory:
   - count keys with `0` usage
   - detect heavily underused variant groups
4. Adjust selection/entry points so underused narrative families are reachable in normal flow.
5. Add rivalry opener narrative:
   - emit one kickoff info message when `isRivalryMatch = true`.
6. Re-enable/guarantee rivalry-after-goal narrative:
   - verify all rivalry goals in regular turns emit `match.rivalry.momentum`.
   - ensure message ordering is coherent (`goal -> rivalry -> restart`).
7. Add guardrail tests:
   - rivalry opener appears once in rivalry matches and never in non-rival matches.
   - rivalry-after-goal appears when applicable in regular turns.
   - no perspective drift introduced.
8. Re-run `300` finals and record before/after delta.

Investigation note (current behavior):
- `match.rivalry.momentum` is currently emitted only inside regular turn pipeline on `turnOutcome.isGoal`.
- Goals resolved via special last-play response path do not go through that emission branch, so they won't show rivalry momentum text there.

### Run Evidence - 300 Finals (2026-05-12)

Report file:
- `scripts/tests/reports/random_300_matches_2026-05-12T03-15-29-830Z.json`

Runtime aggregate:
- `sampleSize`: `300`
- `totalTurns`: `3482`
- `averageTurns`: `11.61`
- `totalMessages`: `24539`
- `messages with messageId`: `20874` (`85.06%`)
- `messages without messageId`: `3665` (`14.94%`)

Outcome aggregation:
- `totalOutcomeMessages`: `2844`
- `NOT_HANDLED`: `1773` (`62.34%` of all outcome messages)

Outcome top:
- `NOT_HANDLED`: `1773`
- `PASS_SUCCESS_PROGRESS`: `252`
- `DRIBBLE_WON`: `174`
- `LONG_PASS_SUCCESS_PROGRESS`: `168`
- `DRIBBLE_LOST`: `148`
- `LONG_PASS_LOST`: `136`
- `PASS_INTERCEPTED`: `126`

`NOT_HANDLED` concentration:
- by action:
  - `PRESS`: `328`
  - `TACKLE`: `316`
  - `BLOCK`: `311`
  - `DEFEND`: `310`
  - `ATTACK`: `268`
  - `HOLD`: `220`
  - `CROSS`: `20`
- by event:
  - `DEFENSE_EVENT`: `600`
  - `KICKOFF_EVENT`: `519`
  - `BALL_POSSESSION_EVENT`: `472`
- by zone:
  - `MIDFIELD`: `1583`
  - `ATTACK_THIRD`: `94`
  - `BOX`: `72`

Coverage check (runtime vs i18n outcome catalog):
- outcomes defined in i18n but **not observed** in this 300-run:
  - `SHOOT_USER_GOAL`
  - `SHOOT_OPPONENT_GOAL`
  - `SHOOT_MISSED`
  - `SHOOT_BLOCKED_REBOUND_AGAINST`

Technical diagnosis (root cause):
1. `NOT_HANDLED` is currently expected for non-duel families.
   - `MatchDuelHelper` explicitly handles only: `PASS`, `LONG_PASS`, `DRIBBLE`, `SHOOT`.
   - Other actions flow through default/fallback path and end with `actionOutcome: NOT_HANDLED`.
2. `SHOOT_USER_GOAL` / `SHOOT_OPPONENT_GOAL` do occur in engine state but not in `match.turn.result.outcome.*` ids.
   - Goal narrative uses keys like `match.turn.userGoal` / `match.turn.opponentGoal` (or counter variants),
     so it does not increment `outcomeCodeCounts`.
3. `SHOOT_MISSED` is practically unreachable in regular open-play.
   - `resolveShootDuel(...)` emits only:
     - `SHOOT_SAVED_REBOUND_FOR`
     - `SHOOT_SAVED_REBOUND_AGAINST`
     - `SHOOT_BLOCKED_REBOUND_FOR`
     - `SHOOT_BLOCKED_REBOUND_AGAINST`
   - No plain miss branch currently exists for regular shot resolution.
4. `SHOOT_BLOCKED_REBOUND_AGAINST` is near-zero because keeper participation dominates shoot-duel resolution.
   - In defense of `BOX/ATTACK_THIRD`, context selection usually includes `GK`.
   - With GK present, current logic prefers `SAVED_*` outcomes over `BLOCKED_*`.

Fix direction (next implementation target):
1. Reduce `NOT_HANDLED` by introducing explicit outcomes for non-duel actions:
   - `PRESS_WON/LOST`, `TACKLE_WON/LOST`, `DEFEND_HOLD/BROKEN`, `ATTACK_PROGRESS/STALLED`, `HOLD_STABLE/LOST`, `CROSS_CONNECTED/CLEARED`.
   - Keep backward compatibility with current narrative keys while adding outcome-specific keys.
2. Make shot outcomes complete in regular open-play:
   - add plain miss branch (`SHOOT_MISSED`) in shoot duel/outcome path.
   - calibrate percentages so `SAVE/BLOCK/MISS` all appear in realistic proportions.
3. Improve blocked-against visibility:
   - ensure some shoot duels are resolved against field defenders (not always GK-first) when shot context allows.
4. Extend audit script/readout:
   - add direct goal counters by message ids (`match.turn.userGoal`, `match.turn.opponentGoal`, counter-goals),
     so goal presence is visible independently from `outcomeCode`.

### Run Evidence - 300 Finals (2026-05-13)

Report file:
- `scripts/tests/reports/random_300_matches_2026-05-13T03-00-57-078Z.json`

Runtime aggregate:
- `sampleSize`: `300`
- `totalTurns`: `3499`
- `averageTurns`: `11.66`
- `totalMessages`: `24573`
- `messages with messageId`: `20883` (`84.98%`)
- `messages without messageId`: `3690` (`15.02%`)

Outcome aggregation:
- `totalOutcomeMessages`: `2996`
- `NOT_HANDLED`: `0` (`0.00%`)

Outcome top:
- `DEFEND_HOLD`: `324`
- `DEFEND_BROKEN`: `309`
- `ATTACK_PROGRESS`: `286`
- `PASS_SUCCESS_PROGRESS`: `225`
- `PRESS_WON`: `194`
- `DRIBBLE_LOST`: `174`
- `HOLD_STABLE`: `174`
- `DRIBBLE_WON`: `170`

Shooting outcomes observed:
- `SHOOT_USER_GOAL`: `107`
- `SHOOT_MISSED`: `101`
- `SHOOT_SAVED_REBOUND_AGAINST`: `26`
- `SHOOT_BLOCKED_REBOUND_AGAINST`: `21`
- `SHOOT_SAVED_REBOUND_FOR`: `7`
- `SHOOT_BLOCKED_REBOUND_FOR`: `10`
- `SHOOT_OPPONENT_GOAL`: `1`

Delta vs previous 300-run baseline (`2026-05-12T03-15-29-830Z`):
- `totalTurns`: `+17` (`3482 -> 3499`)
- `averageTurns`: `+0.05` (`11.61 -> 11.66`)
- `totalShotsByUser`: `+54` (`208 -> 262`)
- `totalShotsUserGoal`: `-35` (`126 -> 91`)
- `totalShotsUserConcede`: `-9` (`15 -> 6`)
- `totalDefensiveActions`: `+33` (`1265 -> 1298`)
- `totalCounterGoalMessages`: `-2` (`2 -> 0`)
- `totalRivalryTriggers`: `-8` (`20 -> 12`)
- `NOT_HANDLED`: `-1773` (`62.34% -> 0.00%`)

Read:
- Main coherence objective of this phase is achieved (`NOT_HANDLED` eliminated from runtime outcomes).
- Shot-family coverage in runtime now matches expected outcome catalog reachability.

### Implementation steps agreed (next pass)

1. [x] Create explicit non-duel outcomes to reduce `NOT_HANDLED`
   - Add concrete outcome codes for:
     - `PRESS`, `TACKLE`, `DEFEND`, `ATTACK`, `HOLD`, `CROSS`.
   - Route these branches through outcome-based narration (avoid generic fallback).
   - Done:
     - added explicit outcomes in `MatchActionOutcome`
     - wired transitions in `match-action-transition.helper.ts`
     - mapped non-duel branches in `match-action-outcome.helper.ts`
     - added EN/ES i18n variants and narrative success mapping
     - tests updated (`match-action-transition.spec.ts`, `match-action-outcome-incidents.spec.ts`)

2. [x] Complete open-play shoot resolution with real `SHOOT_MISSED`
   - Ensure shot non-goal can end as:
     - `SHOOT_SAVED_REBOUND_*`
     - `SHOOT_BLOCKED_REBOUND_*`
     - `SHOOT_MISSED`
   - Keep transition coherence (`zone/possession/carrier`) for each branch.
   - Done:
     - `match-duel.helper.ts` now resolves explicit off-target branch to `SHOOT_MISSED`
     - defender-vs-goalkeeper split added for on-target shots
     - `match-action-outcome.helper.ts` short-circuits `SHOOT_MISSED` to non-goal path
       (prevents miss branch from becoming goal by later probability checks)
     - tests added/updated:
       - `match-duel.helper.spec.ts` (explicit `SHOOT_MISSED` case)
       - `match-action-outcome-incidents.spec.ts` (guardrail: `SHOOT_MISSED` never turns goal)

3. [x] Rebalance shoot branch so `SHOOT_BLOCKED_REBOUND_AGAINST` appears naturally
   - Reduce goalkeeper-only dominance when context allows defender-first blocks.
   - Tune branch weights to maintain realistic save/block/miss distribution.
   - Done:
     - `match-duel.helper.ts` now resolves shot primary defender by zone-aware GK involvement
       (instead of forced goalkeeper on every on-target shot).
     - `SHOOT_MISSED` collection path now uses dedicated miss collector logic by zone.
     - rebound ownership chance now differentiates saved-vs-blocked and zone, improving
       `SHOOT_BLOCKED_REBOUND_AGAINST` reachability in open play.
     - tests extended:
       - `match-duel.helper.spec.ts` now includes a deterministic branch for
         `SHOOT_BLOCKED_REBOUND_AGAINST` (forced DF block without GK in zone).

4. [x] Expose `SHOOT_USER_GOAL` / `SHOOT_OPPONENT_GOAL` in outcome narrative keys
   - For regular-turn and penalty goals, set `actionOutcome` by scoring side.
   - For regular play, emit `match.turn.result.outcome.SHOOT_USER_GOAL.<N>` or `...SHOOT_OPPONENT_GOAL.<N>`.
   - Keep `match.lastPlay.*` keys only for last-play storyline.
   - Done:
     - removed branch-specific goal push from `match-play-turn-pipeline.helper.ts` and routed goals through `MatchOutcomeMessageHelper.resolveOutcomeMessage(...)`.
     - regular mode goals now resolve by outcome variant key:
       - `match.turn.result.outcome.SHOOT_USER_GOAL.<N>`
       - `match.turn.result.outcome.SHOOT_OPPONENT_GOAL.<N>`
     - last-play goals still use `match.lastPlay.attackGoal` / `match.lastPlay.counterGoal`.
     - added integration guardrail:
       - `scripts/tests/match-outcome-message-goal-variant.spec.ts`

5. Extend report script metrics
   - Keep `messageId` + `outcomeCode` tracking.
   - Add direct goal counters for:
     - `match.turn.userGoal`
     - `match.turn.opponentGoal`
     - `match.turn.userCounterGoal`
     - `match.turn.opponentCounterGoal`
    - `match.turn.result.outcome.SHOOT_USER_GOAL.<N>`
    - `match.turn.result.outcome.SHOOT_OPPONENT_GOAL.<N>`

6. Validation and comparison
   - Add/adjust tests for:
     - new non-duel outcomes
     - `SHOOT_MISSED` reachability
     - `SHOOT_BLOCKED_REBOUND_AGAINST` reachability
     - `SHOOT_USER_GOAL` / `SHOOT_OPPONENT_GOAL` outcome-key path
   - Current status:
     - outcome-key path covered (`match-outcome-message-goal-variant.spec.ts`) ✅
     - pending: rerun 300 finals and compare frequencies/report.
   - Re-run 300 finals and compare against baseline report:
     - lower `NOT_HANDLED` share
     - presence of previously missing outcomes
     - stable coherence in actor/zone/possession.


---

## Narrative Upgrade - Epic Broadcast Style (EN/ES)

Status: [x] Completed (catalog + runtime wiring)

Objective:
- Upgrade the match narration to a high-intensity, minute-by-minute football broadcast tone.
- Keep gameplay logic unchanged.
- Increase narrative variety to reduce repetition and improve emotional pacing.

Implementation plan (detailed):
1. Expand action context variants to **15 per action** in both languages.
   - cover all action families used by turn narration, including penalty/goalkeeper choices.
2. Expand turn result variants to **15 per action/category** (`success`/`fail`) in EN/ES.
3. Expand outcome variants to **15 per outcome code** in EN/ES to avoid repetitive fallback loops.
4. Keep actor/possession coherence path intact:
   - no narrative-only hacks that desync from resolved outcome.
5. Add high-intensity narrative tails:
   - epic cadence, pressure, crowd reaction, momentum swings.
6. Preserve placeholders and compatibility:
   - `{playerName}`, `{teamName}`, `{opponentTeamName}`, `{zone}`.
7. Validate with guardrails + build:
   - ensure key resolution still works for every branch.

What changed in code:
- Context, result, and outcome variants are normalized to 15 via coverage helpers in:
  - `src/i18n/i18n.service.ts`
- Runtime counts aligned to 15 in:
  - `src/match/model/match-engine.constants.ts`
- Context variant action set now includes penalty/goalkeeper actions so they also receive action-specific storytelling.

### Editorial reference (real match style sample)

The following style cues were used as tone reference (epic, minute-by-minute, emotional):
- "¡ATAJÓ BELTRÁN Y ESTAMOS EN CUARTOS!"
- "ERRÓ SAN LORENZO... ¡ESTAMOS VIVOS!"
- "¡GOOOOOOOOOOOL DE RIVEEEEEEER!"
- "Final del segundo tiempo... Habrá alargue..."
- "Arrancan los penales..."
- "Amonestado..."
- "¡Expulsado...!"
- "Lo tuvo..."
- "Se lo perdió..."
- "Cambio en River / Cambio en San Lorenzo..."

Narrative characteristics extracted from reference:
1. High emotional intensity in key moments (goals, saves, misses, cards).
2. Fast action-first phrasing.
3. Tactical and momentum framing between major sequences.
4. Live-coverage rhythm (short, decisive, escalating commentary).
5. Distinct tone between routine build-up and decisive events.
- Safety tests:
  - all selected players belong to original roster and no duplicates appear in a pool.

---

## Narrative Reliability Hotfix Plan (Kickoff + Halftime Visibility)

Context observed in manual run:
- Kickoff header/kickoff line can appear mixed-language (ES + EN) in some flows.
- Halftime coach commentary can be generated but not always visible in final `messageItems` for the turn.

### Root-cause summary
1. **Kickoff persistence was EN-hardcoded in start flow**
   - `match.message`, `recordMatchTurnContext.headline`, and kickoff `match_stat.message` used EN variants.
2. **Halftime commentary can be trimmed by per-turn cap**
   - Output builder slices by `maxMessagesPerTurn` with no pinning for halftime key messages.
3. **Active-final start path may skip explicit kickoff bundle**
   - On `startFinal` with an already active match, response can be built from current state without re-emitting kickoff header/kickoff pair when still in initial kickoff state.

### Implementation plan
1. **Start localization hardening**
   - Persist kickoff/start headline in the resolved request language, not EN fixed.
   - Align:
     - `match.message`
     - turn-context `headline`
     - kickoff `match_stat.message`
2. **Halftime message pinning**
   - Add optional internal `key` tracking per localized turn item.
   - In turn output slicing, pin these keys so they survive truncation:
     - `match.halftime.summary.*`
     - `match.halftime.variant.*`
     - `match.halftime.prompt`
3. **Active kickoff replay in start flow**
   - If `startFinal` returns an existing active match that is still in initial kickoff state, emit localized kickoff header + kickoff line in `messageItems`.
4. **Regression tests**
   - Kickoff/start response in `es` must not leak EN kickoff headline in response message items.
   - Halftime turn output keeps summary + coach variant + prompt even when message list exceeds cap.

---

## User Tactical Shift Messaging Plan (2026-05-12)

Objective:
- When the **user team** changes strategy/formation during an active final, emit a timeline message just like opponent tactical shifts.
- Add **at least 2 variants per strategy** in EN/ES so the message does not feel repetitive.

Scope:
1. Detect user tactical shifts in prepare stage:
   - file: `src/match/helper/match-play-prepare.helper.ts`
   - capture previous user strategy/formation from `match.strategy` + `match.formation` before refresh
   - compare against refreshed team values from `teamsService`
   - expose `userTacticalShift` in prepared payload only when a real change happened

2. Extend play contract:
   - file: `src/match/interfaces/match-engine.interface.ts`
   - add `userTacticalShift` to `MatchEnginePreparePlayResult`
   - include previous/new strategy+formation for narrative params

3. Add i18n keys with strategy-specific variants (EN/ES):
   - file: `src/i18n/i18n.service.ts`
   - generic fallback:
     - `match.tactics.userShift`
   - per-strategy variants:
     - `match.tactics.userShift.ATTACK.1`, `.2`
     - `match.tactics.userShift.DEFENSE.1`, `.2`
     - `match.tactics.userShift.PENALTIES.1`, `.2`
     - `match.tactics.userShift.COUNTER_ATTACK.1`, `.2`
     - `match.tactics.userShift.BALANCED.1`, `.2`
     - `match.tactics.userShift.POSSESSION.1`, `.2`

4. Emit timeline message during regular turn pipeline:
   - file: `src/match/helper/match-play-turn-pipeline.helper.ts`
   - if `preparedTurn.userTacticalShift` exists:
     - pick random variant key (`1|2`) for the current strategy
     - fallback to `match.tactics.userShift` if a specific key is missing
     - emit through `pushTurnMessage(MatchMessageType.INFO, key, params, metadata)`
   - metadata must include user team context (`teamId`, `teamName`, `minute`, `turn`)

5. Guardrails/tests:
   - new script test under `scripts/tests/`:
     - verify all strategy variant keys exist in EN and ES (`.1` and `.2`)
     - verify shift detector returns change only when strategy or formation differs
     - verify pipeline key resolver returns strategy-scoped key or generic fallback

Expected impact:
- Gameplay logic/probabilities unchanged (narrative-only enhancement).
- Better UX parity: user tactical changes become visible in timeline, matching opponent behavior.

Implementation status:
- [x] Prepare stage detects `userTacticalShift` (previous vs refreshed strategy/formation)
- [x] Engine prepared contract extended with `userTacticalShift`
- [x] Pipeline emits user tactical shift timeline message with strategy-scoped random variant
- [x] EN/ES keys added: generic fallback + 2 variants per strategy
- [x] Guardrail script added:
  - `scripts/tests/match-user-tactics-shift-message.spec.ts`

---

### Phase 9 (Addendum) - Last-Play Perspective Variants (`FOR/AGAINST`) (2026-05-13)

Objective:
- Replace generic last-play intro texts with perspective-aware variants.
- Support 5 variants per scenario for both languages.

Plan:
1. i18n keys (EN/ES):
   - `match.lastPlay.penalty.for.1..5`
   - `match.lastPlay.penalty.against.1..5`
   - `match.lastPlay.oneOnOne.for.1..5`
   - `match.lastPlay.oneOnOne.against.1..5`
2. Runtime key resolution:
   - map `LAST_PLAY_*` event to a perspective-aware base key.
   - choose randomized variant `.1..5`.
   - fallback to legacy generic keys if a variant key is missing.
3. Tests:
   - validate penalty-against still references goalkeeper correctly.
   - validate event -> key family mapping for all 4 last-play events.

Implementation status:
- [x] Added 20 EN + 20 ES perspective-aware last-play scenario keys.
- [x] `match-play-turn-pipeline.helper.ts` now resolves scenario key by event family + random variant (`.1..5`).
- [x] Legacy fallback preserved (`match.lastPlay.penalty` / `match.lastPlay.oneOnOne`) when variant keys are unavailable.
- [x] Updated `scripts/tests/match-last-play-penalty-goalkeeper.spec.ts` with:
  - goalkeeper coherence check using new key families,
  - key-family mapping check for the 4 `LAST_PLAY_*` event types.
