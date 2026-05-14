# TP - World Cup API

## Overview
`world-cup-api` is the external API used by the TP.

It provides:
- Team catalogs and tactical configuration.
- World Cup simulation lifecycle (`READY_FOR_FINAL`, `FINAL_ACTIVE`, `ENDED`).
- Stateful final match engine (turn-based).
- Match telemetry (timeline, stats, squads, lineups).
- Educational dictionaries for football/game terms.

Important:
- Students should consume this API from their backend (BFF), not directly from the final frontend.
- Default base URL is `http://localhost:5101/worldCup`.

---

## Modules (current code)
- `health`
- `teams`
- `world-cup`
- `match`
- `reference`

---

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Create local env file:
```bash
cp .env.example .env
```

3. Run API:
```bash
npm run start:dev
```

Notes:
- `start`, `start:dev`, `start:debug`, and `start:prod` run `db:seed` automatically before boot.
- If you want to seed manually:
```bash
npm run db:seed
```

4. Open Swagger:
- `http://localhost:5101/worldCup/api`

---

## Runtime Scripts
- `npm run build`
- `npm run start:dev`
- `npm run start:debug`
- `npm run start:prod`
- `npm run smoke:test`

Match/engine test scripts:
- `npm run test:action-transition`
- `npm run test:duel`
- `npm run test:match-options-matrix`
- `npm run test:turn-coherence`
- `npm run test:turn-flow-state-alignment`
- `npm run test:turn-context-persistence`
- `npm run test:turn-outcome-guardrails`
- `npm run test:last-play-penalty-goalkeeper`
- `npm run test:recovery-role-coherence`
- `npm run test:zone-receiver-coherence`

Mass simulation utility:
```bash
node scripts/tests/run-random-finals.mjs 100
```
- Optional env: `WC_API_BASE` (default `http://127.0.0.1:5101/worldCup`)
- Reports are written to `scripts/tests/reports/`

---

## API Base Path and Swagger
Global prefix comes from `APP_BASE_PATH` (default: `worldCup`).

So routes are exposed as:
- `/{APP_BASE_PATH}/health`
- `/{APP_BASE_PATH}/teams/...`
- `/{APP_BASE_PATH}/world-cup/...`
- `/{APP_BASE_PATH}/match/...`
- `/{APP_BASE_PATH}/reference/...`

Swagger:
- `/{APP_BASE_PATH}/api`

---

## Response Envelope and Errors
All controllers return the same envelope (`ResponseObject<T>`):

```json
{
  "serverTime": "2026-05-05T12:00:00.000Z",
  "success": true,
  "responseMessage": {
    "messageCode": "0000",
    "message": "OK"
  },
  "data": {}
}
```

Errors are normalized by `AllExceptionsFilter` and follow the same envelope with `success=false`.

---

## Environment Variables

### App / Swagger
| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `5101` | HTTP port |
| `APP_BASE_PATH` | `worldCup` | Global route prefix |
| `APP_LOG_LEVEL` | `log` | `error`, `warn`, `log`, `debug`, `verbose` |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5300` | Allowed frontend origin |
| `SWAGGER_APP_TITLE` | `World Cup API` | Swagger title |
| `SWAGGER_APP_DESCRIPTION` | `World Cup API for Programacion III TP` | Swagger description |
| `SWAGGER_APP_VERSION` | `1.0.0` | Swagger version label |
| `SWAGGER_THEME` | `dark` | Swagger theme (`classic`, `dark`) |

### Database / World Cup
| Variable | Default | Description |
|---|---|---|
| `DB_TYPE` | `sqlite` | Only `sqlite` is supported |
| `DB_DATABASE` | `./database/world_cup_api.db` | SQLite file path |
| `WORLD_CUP_EDITION` | `2026` | Edition label returned by world cup simulation |

### Match Engine (runtime tuning)
| Variable | Default | Description |
|---|---|---|
| `MAX_TURNS_PER_MATCH` | `10` (example) | Engine normalizes to an even number and enforces minimum floor (`>=5`, odd values are rounded up) |
| `MAX_MESSAGES_PER_TURN` | `15` | Clamped between `2` and `20` |
| `MAX_MATCH_SUBSTITUTIONS_PER_TEAM` | `5` | Max substitutions per team |
| `AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE` | `true` | Auto-adjust formation if incompatible after strategy change |
| `OPPONENT_TACTICS_ONLY_SECOND_HALF_ENABLED` | `true` | Opponent AI switches tactics only after halftime |
| `OPPONENT_TACTICS_COOLDOWN_TURNS` | `1` | Cooldown turns between AI tactical changes |
| `OPPONENT_MAX_STRATEGY_CHANGES_PER_MATCH` | `5` | Max AI strategy switches per match |
| `COACH_FORMATION_STYLE_STRICTNESS` | `6` | Coach style influence (`0..10`) when selecting compatible formations |

### Optional action-pool overrides (advanced)
These variables accept comma-separated `MatchAction` values. If parsing yields fewer than 3 valid actions, defaults are used.

- `MATCH_ACTIONS_NORMAL`
- `MATCH_ACTIONS_KICKOFF_EVENT`
- `MATCH_ACTIONS_ATTACK_EVENT`
- `MATCH_ACTIONS_DEFENSE_EVENT`
- `MATCH_ACTIONS_PENALTY_FOR_EVENT`
- `MATCH_ACTIONS_PENALTY_AGAINST_EVENT`
- `MATCH_ACTIONS_FREE_KICK_FOR_EVENT`
- `MATCH_ACTIONS_FREE_KICK_AGAINST_EVENT`
- `MATCH_ACTIONS_CORNER_FOR_EVENT`
- `MATCH_ACTIONS_CORNER_AGAINST_EVENT`
- `MATCH_ACTIONS_THROW_IN_FOR_EVENT`
- `MATCH_ACTIONS_THROW_IN_AGAINST_EVENT`

---

## Endpoints (current controllers)

### Health
| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Liveness + uptime |

### Teams
| Method | Route | Description |
|---|---|---|
| `GET` | `/teams` | List teams (`teamId`, `name` optional filters) |
| `GET` | `/teams/coaches` | List coaches (`teamId`, `nationality` optional filters) |
| `GET` | `/teams/:teamId/stats` | Team stats + current tactical context |
| `GET` | `/teams/:teamId/players` | Team squad |
| `GET` | `/teams/:teamId/history` | Team history / titles |
| `GET` | `/teams/:teamId/rivals` | Historical rivals |
| `GET` | `/teams/:teamId/strategy` | Current strategy |
| `GET` | `/teams/:teamId/formation` | Current formation |

### World Cup
| Method | Route | Description |
|---|---|---|
| `POST` | `/world-cup/simulate` | Simulate full tournament until pending final |
| `GET` | `/world-cup/current` | Current world cup metadata + lifecycle flags |
| `GET` | `/world-cup/current/groups` | Current groups |
| `GET` | `/world-cup/current/matches` | Current matches (`stage` optional) |
| `GET` | `/world-cup/current/stats` | Current aggregated stats (ENDED only) |
| `GET` | `/world-cup/current/player-stats` | Current full player stats (`teamId` optional) |
| `GET` | `/world-cup/current/awards` | Current awards (`lang` optional, includes fair-play card totals when applicable) |
| `GET` | `/world-cup/current/teams/:teamId/journey` | Current journey by team |
| `GET` | `/world-cup/history` | Historical world cup ids |
| `GET` | `/world-cup/:worldCupId` | World cup metadata by id |
| `GET` | `/world-cup/:worldCupId/groups` | Groups by id |
| `GET` | `/world-cup/:worldCupId/matches` | Matches by id (`stage` optional) |
| `GET` | `/world-cup/:worldCupId/stats` | Aggregated stats by id (ENDED only) |
| `GET` | `/world-cup/:worldCupId/player-stats` | Full player stats by id (`teamId` optional) |
| `GET` | `/world-cup/:worldCupId/awards` | Awards by id (`lang` optional, includes fair-play card totals when applicable) |
| `GET` | `/world-cup/:worldCupId/teams/:teamId/journey` | Journey by world cup id + team |

`stage` values:
- `GROUP_STAGE`
- `ROUND_OF_32`
- `ROUND_OF_16`
- `QUARTER_FINALS`
- `SEMI_FINALS`
- `THIRD_PLACE`
- `FINAL`

### Match
| Method | Route | Description |
|---|---|---|
| `GET` | `/match/current/stats` | Active final timeline/summary; if no active final, fallback to latest final linked to current world cup |
| `GET` | `/match/current/squad` | Active final squad telemetry; same fallback behavior |
| `GET` | `/match/current/lineups` | Active final on-field lineups; same fallback behavior |
| `GET` | `/match/:matchId/stats` | Timeline/summary by match id |
| `GET` | `/match/:matchId/squad` | Squad telemetry by match id |
| `GET` | `/match/:matchId/lineups` | On-field lineups by match id |
| `GET` | `/match/strategies` | Strategy catalog (`lang` optional) |
| `GET` | `/match/formations` | Formation catalog (`lang` optional) |
| `GET` | `/match/message-types` | Message item type catalog |
| `GET` | `/match/historic-finals` | Finished final ids (newest first) |
| `POST` | `/match/start-final` | Start final or return current active final |
| `POST` | `/match/select-strategy` | Persist strategy for team |
| `POST` | `/match/select-formation` | Persist formation for team |
| `POST` | `/match/reset-team-tactics` | Reset strategy/formation to defaults |
| `POST` | `/match/play` | Resolve one turn |

### Reference
| Method | Route | Description |
|---|---|---|
| `GET` | `/reference/game-dictionary` | Localized football/game dictionary (`lang`) |
| `GET` | `/reference/coach-profiles` | Localized coach profile glossary (`lang`) |

---

## Recommended Match Flow
1. `POST /world-cup/simulate`
2. `POST /match/start-final`
3. Optionally tweak tactics:
   - `POST /match/select-strategy`
   - `POST /match/select-formation`
4. Loop with `POST /match/play` using returned `selectedOption` index.
5. Read telemetry from:
   - `GET /match/current/stats`
   - `GET /match/current/squad`
   - `GET /match/current/lineups`

---

## Match Engine Behavior (important)
- `lang` supports `en`/`es` and defaults to `en`.
- `play.selectedOption` is `1..4`.
- Half-time options are reduced to:
  - `RESTART_MATCH`
  - `QUIT_MATCH`
- `FORFEIT_EVENT` and `END` expose no playable actions.
- Responses include `currentContext` for observability (turn, possession, acting player, players in zone, tactical snapshot, etc.).
- `messageItems` are typed (`CONTEXT`, `RESULT`, `SUBSTITUTION`, `INJURY`, `YELLOW_CARD`, `RED_CARD`, `RESTART`, `FINAL`, `INFO`, ...).

### `start-final` behavior
- If there is already an active final, the endpoint returns that match (after syncing tactical state).
- If no active final exists:
  - It uses the pending finalists from the current world cup (`READY_FOR_FINAL`), or
  - Auto-simulates a new world cup when current tournament is missing/ended and `teamId` is provided.
- If `teamId` is provided, it must be one of the two finalists.
- If world cup is `FINAL_ACTIVE`, re-simulation is blocked until final is closed.

---

## Notes for Integrators
- Use `/reference/game-dictionary` and `/reference/coach-profiles` to avoid hardcoding labels in frontend.
- Prefer reading actions from the response (`options`) rather than constructing action menus client-side.
- For educational debugging, combine:
  - `MatchResponse.currentContext`
  - `/match/{matchId}/stats`
  - `/match/{matchId}/squad`

---

## Smoke / Stability
- Local smoke e2e:
```bash
npm run smoke:test
```
- Engine consistency checks are available under `scripts/tests/*.spec.ts`.
