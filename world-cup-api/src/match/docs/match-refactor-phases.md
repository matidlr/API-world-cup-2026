# Match Refactor Plan (Service Lean + Helper-Driven Engine)

## Goal
- `MatchService` must be lean: facade/pass-through only for `play` and `startFinal`.
- `MatchEngine` must be a lightweight orchestrator.
- Business rules must live in specialized helpers.
- New functionality should be added by creating/extending helpers, not by growing service/engine.

## Design Rules
- `MatchService`: validate/delegate/return.
- `MatchEngine`: stage orchestration only, no heavy rule blocks.
- Stage helpers own behavior:
  - prepare
  - special-events
  - turn pipeline
  - post-turn
  - response/persistence
- Prefer `switch` for event dispatch and finite-state decisions.
- Keep guard clauses as `if` (null, early exits, invalid input).

## Phases

### Phase 1 - Baseline + Plan Setup
Status: [x] Completed

Tasks:
1. Create this phase document with explicit scope and completion markers.
2. Confirm existing helper inventory and gaps.
3. Define target staging contracts for `play` pipeline.

Acceptance:
- Plan file exists and is versioned.
- Stage contracts are clear and actionable.

---

### Phase 2 - Stage Contracts + Wiring Preparation
Status: [x] Completed

Tasks:
1. Normalize stage interfaces to run on a shared `MatchPlayStageContext`.
2. Ensure all stage helpers are injectable and typed.
3. Remove placeholder signatures that still accept raw request when context should be used.

Acceptance:
- `prepare -> special-events -> turn-pipeline -> post-turn -> response` contract chain compiles.

---

### Phase 3 - Extract `play` orchestration into stage helpers
Status: [x] Completed

Tasks:
1. Implement `MatchPlayPrepareHelper`:
   - load active match and tactical/player snapshots
   - validate selected option
   - return `MatchPlayStageContext`
2. Implement `MatchPlaySpecialEventsHelper`:
   - handle `QUIT_MATCH`
   - handle `HALF_TIME_EVENT`
   - handle invalid restart
   - handle `LAST_PLAY_*`
   - use `switch` by event/action family
3. Implement `MatchPlayTurnPipelineHelper`:
   - regular turn flow:
     - define turn
     - apply turn advance
     - penalty/card/outcome/restart transition
4. Implement `MatchPlayPostTurnHelper`:
   - fatigue/injuries/substitutions/captain
   - coach tactical updates
   - halftime transitions
   - close at 90 / last-play prepare
5. Implement `MatchPlayResponseHelper`:
   - finalize response state
   - finalize narrative output
   - persist context/stat
   - map response

Acceptance:
- `play` core behavior runs end-to-end through stage helpers.

Task-by-task status (checked against current code):
1. [x] `MatchPlayPrepareHelper`
   - [x] load active match and tactical/player snapshots
   - [x] validate selected option
   - [x] return `MatchPlayStageContext`
2. [x] `MatchPlaySpecialEventsHelper`
   - [x] handle `QUIT_MATCH`
   - [x] handle `HALF_TIME_EVENT`
   - [x] handle invalid restart
   - [x] handle `LAST_PLAY_*`
   - [x] use `switch` by event/action family
3. [x] `MatchPlayTurnPipelineHelper` (regular turn flow)
   - [x] define turn
   - [x] apply turn advance
   - [x] penalty/card/outcome/restart transition
4. [x] `MatchPlayPostTurnHelper`
   - [x] fatigue/injuries/substitutions/captain
   - [x] coach tactical updates
   - [x] halftime transitions
   - [x] close at 90 / last-play prepare
5. [x] `MatchPlayResponseHelper`
   - [x] finalize response state
   - [x] finalize narrative output
   - [x] persist context/stat
   - [x] map response

Notes:
- `MatchEngine.play` already calls the stage chain (`prepare -> special-events -> turn-pipeline -> post-turn -> response`).
- `special-events` is now functional and dispatches through `switch`.
- `post-turn` logic was extracted to `MatchPlayPostTurnHelper` and invoked from pipeline.
- `response` helper now owns final response state, final narrative output, context persistence and response mapping.
- `MatchPlayTurnPipelineHelper` now emits a response payload and delegates final response construction to `MatchPlayResponseHelper`.

---

### Phase 4 - Move orchestration into MatchEngine
Status: [x] Completed

Tasks:
1. Add `matchEngine.play(request)`.
2. `matchEngine.play` must orchestrate stages only.
3. `MatchService.play` delegates to `matchEngine.play` directly.

Acceptance:
- `MatchService.play` is facade-only.
- Engine is orchestrator-only (no giant rule blocks introduced).

---

### Phase 5 - Make MatchService lean (final cleanup)
Status: [x] Completed

Tasks:
1. Remove turn logic leftovers from `MatchService` that moved to stage helpers.
2. Keep non-play APIs intact (`stats/squad/lineups`, catalogs, tactic setters).
3. Keep `startFinal` delegation intact.

Acceptance:
- `MatchService` no longer owns the heavy turn loop.

Task-by-task status:
1. [x] Remove turn logic leftovers from `MatchService` moved to stage helpers.
2. [x] Keep non-play APIs intact (`stats/squad/lineups`, catalogs, tactic setters).
3. [x] Keep `startFinal` delegation intact.

---

### Phase 6 - `if` to `switch` normalization
Status: [x] Completed

Tasks:
1. Replace eligible event-family `if` chains with `switch` in stage helpers.
2. Replace card/restart decision trees with `switch` where finite cases apply.
3. Preserve guard `if` and avoid over-switching simple checks.

Acceptance:
- Finite decision branches are switch-driven and clearer.

Task-by-task status:
1. [x] Replace eligible event-family `if` chains with `switch` in stage helpers.
2. [x] Replace card/restart decision trees with `switch` where finite cases apply.
3. [x] Preserve guard `if` and avoid over-switching simple checks.

---

### Phase 7 - Validation + Stabilization
Status: [x] Completed

Tasks:
1. Build + existing test suite.
2. Run matrix/coherence/guardrail tests.
3. Run smoke simulations and verify no functional regressions in play flow.

Acceptance:
- Build green.
- Key tests green.
- No known gameplay regression introduced by refactor.

---

### Phase 8 - Targeted `if` -> `switch` Refactor (Safe-Only)
Status: [x] Completed

Objective:
- Improve readability/maintainability of finite decision trees without forcing `switch` where guard-based flow is clearer.
- Apply only high-value, low-risk conversions.

Scope decision:
- We will refactor **only where it clearly improves finite enum dispatch**.
- We will **not** force `switch` in additive probability formulas, guard-heavy flows, or pipeline orchestration guards.

Implementation order (recommended):
1. `match-discipline.helper.ts`
2. `match-open-play-restart.helper.ts`
3. `match-player-selection.helper.ts`
4. `match-turn-input.helper.ts` (partial)
5. `match-probability.helper.ts` (strategy bonus dispatch only)

Detailed plan by file:

1. `match-discipline.helper.ts` (high value, low risk)
- Convert `resolveCardOutcome(...)` to `switch(eventType)`.
- Convert `applyRedCardPenalty(...)` to `switch(side)` + nested `switch(position)`.
- Keep null/early guards as `if`.

2. `match-open-play-restart.helper.ts` (high value, low risk)
- Convert set-piece exclusion checks in `resolveOpenPlayRestartEvent(...)` to event-family `switch` (or equivalent enum dispatch helper).
- Convert `resolvePossessionFromRestartEvent(...)` to `switch(eventType)`.
- Convert `resolveRestartEventByZone(...)` to `switch(zone)`.
- Keep probabilistic guards as `if`.

3. `match-player-selection.helper.ts` (high value)
- Refactor `getPreferredPositions(...)` to `switch(action)` for action-family dispatch.
- Keep zone-based sub-dispatch (`switch(zone)`) for PASS/HOLD/LONG_PASS logic.
- Preserve existing preference order semantics.

4. `match-turn-input.helper.ts` (partial, medium risk)
- Refactor strategy branch in `pickEventType(...)` to `switch(strategy)`.
- Keep top random/card/penalty guards and probability thresholds as-is.
- Keep `pickZone(...)` mostly guard-driven; only extract event-family checks if clarity improves.

5. `match-probability.helper.ts` (selective only)
- Refactor strategy dispatch methods to `switch(strategy)`:
  - `resolveTeamGoalStrategyBonus(...)`
  - `resolveOpponentGoalStrategyBonus(...)`
  - `resolveCounterStrategyBonus(...)`
- Do **not** refactor main additive probability equations to switch.

Explicitly out of scope for this phase:
- `match-play-turn-pipeline.helper.ts` guard/flow chains.
- `match-turn-output.helper.ts` guard/formatting branches.
- Large numeric chance formulas outside strategy-dispatch helpers.

Acceptance criteria:
- Behavior parity preserved (no gameplay regression expected).
- Existing tests remain green.
- Readability improves in finite enum dispatch points only.

Validation checklist:
- [x] Run unit/integration suite.
- [x] Run match coherence tests.
- [x] Run smoke simulation batch and compare key metrics deltas.

Completion notes:
- Applied safe-only switch-dispatch refactors in:
  - `match-discipline.helper.ts`
  - `match-open-play-restart.helper.ts`
  - `match-player-selection.helper.ts`
  - `match-turn-input.helper.ts` (strategy branch in `pickEventType`)
  - `match-probability.helper.ts` (strategy bonus dispatch methods only)
- Verified behavior parity with guardrail/coherence test suite.
- Main commits:
  - `7892a21` - safe helper dispatch refactor block
  - `e5fbb84` - probability strategy bonus switch refactor
- Release tag:
  - `v1.0.124`

---

## Completion Checklist
- [x] Service facade achieved for `play`
- [x] Engine orchestrator achieved for `play`
- [x] Stage helpers implemented and wired
- [x] Engine/pipeline circular dependency removed (via `MatchTurnFlowHelper`)
- [x] Stage logic fully split (special-events, post-turn, response)
- [x] Switch-based event dispatch in stage flow
- [x] Tests and smoke verification complete
