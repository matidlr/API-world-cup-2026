#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SMOKE_ENV_FILE="${SMOKE_ENV_FILE:-$API_DIR/.env.smoke}"
if [[ -f "$SMOKE_ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$SMOKE_ENV_FILE"
  set +a
fi

APP_PORT="${APP_PORT:-4101}"
APP_BASE_PATH="${APP_BASE_PATH:-worldCup}"
APP_BASE_PATH="${APP_BASE_PATH#/}"
APP_BASE_PATH="${APP_BASE_PATH%/}"
APP_BASE_PATH="${APP_BASE_PATH:-worldCup}"

BASE_URL="${BASE_URL:-http://localhost:${APP_PORT}/${APP_BASE_PATH}}"
HEALTH_URL="${HEALTH_URL:-$BASE_URL/health}"
SMOKE_TEAM_ID="${SMOKE_TEAM_ID:-smk01}"
SMOKE_TEAM_NAME_QUERY="${SMOKE_TEAM_NAME_QUERY:-fictional}"
SMOKE_EXPECTED_TEAM_COUNT="${SMOKE_EXPECTED_TEAM_COUNT:-48}"

SMOKE_START_WORLD_CUP_API="${SMOKE_START_WORLD_CUP_API:-true}"
SMOKE_REUSE_EXISTING="${SMOKE_REUSE_EXISTING:-false}"
SMOKE_CLEANUP_DB="${SMOKE_CLEANUP_DB:-true}"
SMOKE_API_COMMAND="${SMOKE_API_COMMAND:-npm run start}"
SMOKE_DB_FILE="${SMOKE_DB_FILE:-$API_DIR/database/worldCupTestDB_$(date +%s).db}"
SMOKE_LOG_FILE="${SMOKE_LOG_FILE:-/tmp/world-cup-api-smoke-$(date +%s).log}"
SMOKE_READY_ATTEMPTS="${SMOKE_READY_ATTEMPTS:-40}"
SMOKE_READY_SLEEP_SECONDS="${SMOKE_READY_SLEEP_SECONDS:-2}"

STARTED_API="false"
REUSED_API="false"
API_PID=""

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq
require_cmd sqlite3

port_listener_pids() {
  lsof -ti "tcp:${APP_PORT}" -sTCP:LISTEN 2>/dev/null || true
}

cleanup() {
  if [[ "$STARTED_API" == "true" && -n "${API_PID:-}" ]]; then
    echo "Stopping local world cup api (pid: $API_PID) ..."
    kill -TERM "$API_PID" >/dev/null 2>&1 || true

    for _ in $(seq 1 10); do
      if ! kill -0 "$API_PID" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if kill -0 "$API_PID" >/dev/null 2>&1; then
      kill -KILL "$API_PID" >/dev/null 2>&1 || true
    fi

    wait "$API_PID" >/dev/null 2>&1 || true

    # In some shells, killing the wrapper PID may leave child node processes alive.
    # Clean up any remaining listeners on the smoke port to avoid flaky reruns.
    local leftover_pids
    leftover_pids="$(port_listener_pids)"
    if [[ -n "$leftover_pids" ]]; then
      echo "Stopping leftover listeners on port $APP_PORT: $leftover_pids"
      kill -TERM $leftover_pids >/dev/null 2>&1 || true
      sleep 1

      leftover_pids="$(port_listener_pids)"
      if [[ -n "$leftover_pids" ]]; then
        kill -KILL $leftover_pids >/dev/null 2>&1 || true
      fi
    fi
  fi

  if [[ "$SMOKE_CLEANUP_DB" == "true" ]]; then
    rm -f "$SMOKE_DB_FILE" "${SMOKE_DB_FILE}-shm" "${SMOKE_DB_FILE}-wal"
    echo "Removed temporary smoke DB: $SMOKE_DB_FILE"
  fi
}

trap cleanup EXIT INT TERM

is_api_healthy() {
  curl -sS "$HEALTH_URL" | jq -e '.success == true and .data.status == "ok"' >/dev/null 2>&1
}

start_api_if_needed() {
  if [[ "$SMOKE_START_WORLD_CUP_API" != "true" ]]; then
    if ! is_api_healthy; then
      echo "World Cup API is not reachable at $BASE_URL and SMOKE_START_WORLD_CUP_API=false." >&2
      exit 1
    fi

    echo "Reusing already running API at $BASE_URL."
    REUSED_API="true"
    return
  fi

  if is_api_healthy; then
    if [[ "$SMOKE_REUSE_EXISTING" == "true" ]]; then
      echo "World Cup API already running at $BASE_URL. Reusing existing process."
      REUSED_API="true"
      return
    fi

    echo "World Cup API already running at $BASE_URL." >&2
    echo "For deterministic smoke tests, use a dedicated port (default 4101) or stop that process." >&2
    echo "If you really want to reuse it, set SMOKE_REUSE_EXISTING=true." >&2
    exit 1
  fi

  mkdir -p "$(dirname "$SMOKE_DB_FILE")"
  echo "Starting World Cup API with temporary DB: $SMOKE_DB_FILE"
  echo "API logs: $SMOKE_LOG_FILE"

  (
    cd "$API_DIR"
    DB_DATABASE="$SMOKE_DB_FILE" \
    APP_PORT="$APP_PORT" \
    APP_BASE_PATH="$APP_BASE_PATH" \
    MAX_TURNS_PER_MATCH="${MAX_TURNS_PER_MATCH:-5}" \
    MAX_MESSAGES_PER_TURN="${MAX_MESSAGES_PER_TURN:-15}" \
    MAX_MATCH_SUBSTITUTIONS_PER_TEAM="${MAX_MATCH_SUBSTITUTIONS_PER_TEAM:-5}" \
    sh -c "$SMOKE_API_COMMAND" >"$SMOKE_LOG_FILE" 2>&1
  ) &

  API_PID="$!"
  STARTED_API="true"

  for _ in $(seq 1 "$SMOKE_READY_ATTEMPTS"); do
    if is_api_healthy; then
      echo "World Cup API is healthy at $BASE_URL."
      return
    fi
    sleep "$SMOKE_READY_SLEEP_SECONDS"
  done

  echo "World Cup API did not become healthy in time." >&2
  tail -n 120 "$SMOKE_LOG_FILE" >&2 || true
  exit 1
}

request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  local response
  if [[ -n "$body" ]]; then
    response="$(curl -sS -X "$method" "$url" \
      -H 'Content-Type: application/json' \
      -d "$body" \
      -w $'\n%{http_code}')"
  else
    response="$(curl -sS -X "$method" "$url" -w $'\n%{http_code}')"
  fi

  local http_code
  http_code="$(printf '%s\n' "$response" | tail -n1)"

  local response_body
  response_body="$(printf '%s\n' "$response" | sed '$d')"

  if [[ "$http_code" -lt 200 || "$http_code" -gt 299 ]]; then
    echo "HTTP $http_code for $method $url" >&2
    echo "$response_body" >&2
    exit 1
  fi

  printf '%s' "$response_body"
}

extract_required() {
  local json="$1"
  local jq_path="$2"

  local value
  value="$(echo "$json" | jq -r "$jq_path // empty")"

  if [[ -z "$value" || "$value" == "null" ]]; then
    echo "Failed to extract $jq_path" >&2
    echo "$json" | jq >&2 || echo "$json" >&2
    exit 1
  fi

  printf '%s' "$value"
}

assert_jq() {
  local json="$1"
  local expression="$2"
  local label="$3"

  if ! echo "$json" | jq -e "$expression" >/dev/null 2>&1; then
    echo "Assertion failed: $label" >&2
    echo "$json" | jq >&2 || echo "$json" >&2
    exit 1
  fi
}

start_api_if_needed

if [[ "$STARTED_API" == "true" ]]; then
  echo "Seeding smoke test DB (fictional team set) ..."
  bash "$SCRIPT_DIR/smoke-db-setup.sh" "$SMOKE_DB_FILE"
else
  echo "Skipping DB seed because API process is being reused."
fi

echo "Checking health endpoint ..."
HEALTH_JSON="$(request GET "$HEALTH_URL")"
assert_jq "$HEALTH_JSON" '.success == true and .data.status == "ok"' 'health endpoint should be ok'

echo "Checking teams list ..."
TEAMS_JSON="$(request GET "$BASE_URL/teams")"
if [[ "$STARTED_API" == "true" ]]; then
  assert_jq "$TEAMS_JSON" '.success == true and (.data | length) == '"$SMOKE_EXPECTED_TEAM_COUNT"'' 'teams should contain expected seeded entries'
else
  assert_jq "$TEAMS_JSON" '.success == true and (.data | length) >= 2' 'teams should contain at least 2 entries'
fi

echo "Checking coaches list and optional filters ..."
COACHES_JSON="$(request GET "$BASE_URL/teams/coaches")"
assert_jq "$COACHES_JSON" '.success == true and (.data | length) >= 1 and (.data[0].name != null) and (.data[0].nationality != null) and (.data[0].age | type) == "number"' 'coaches endpoint should return coach metadata'

COACHES_TEAM_FILTER_JSON="$(request GET "$BASE_URL/teams/coaches?teamId=$SMOKE_TEAM_ID")"
assert_jq "$COACHES_TEAM_FILTER_JSON" '.success == true and (.data | length) == 1 and .data[0].teamId == "'"$SMOKE_TEAM_ID"'"' 'coaches teamId filter should return one exact match'

COACHES_FILTER_JSON="$(request GET "$BASE_URL/teams/coaches?nationality=mock")"
if [[ "$STARTED_API" == "true" ]]; then
  assert_jq "$COACHES_FILTER_JSON" '.success == true and (.data | length) >= 1 and (.data | all(.nationality | ascii_downcase | contains("mock")))' 'coaches nationality filter should work for smoke data'
else
  assert_jq "$COACHES_FILTER_JSON" '.success == true' 'coaches nationality filter should return success'
fi

echo "Checking search by name ..."
SEARCH_JSON="$(request GET "$BASE_URL/teams?name=$SMOKE_TEAM_NAME_QUERY")"
assert_jq "$SEARCH_JSON" '.success == true and (.data | length) >= 1 and (.data | map(.id) | index("'"$SMOKE_TEAM_ID"'")) != null' 'search by name should return smoke team'

echo "Checking team stats ..."
STATS_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/stats")"
assert_jq "$STATS_JSON" '.success == true and .data.attack >= 1 and .data.overall >= 1' 'team stats should exist'

echo "Checking team filter, players, history, rivals, strategy ..."
TEAM_FILTER_JSON="$(request GET "$BASE_URL/teams?teamId=$SMOKE_TEAM_ID")"
assert_jq "$TEAM_FILTER_JSON" '.success == true and (.data | length) == 1 and .data[0].id == "'"$SMOKE_TEAM_ID"'"' 'teamId filter should return one exact team'

PLAYERS_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/players")"
assert_jq "$PLAYERS_JSON" '.success == true and (.data | length) >= 1 and (.data[0].shirtNumber | type) == "number" and (.data[0].age | type) == "number"' 'team players should include shirt number and age'

HISTORY_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/history")"
assert_jq "$HISTORY_JSON" '.success == true and (.data.titles | type) == "array"' 'team history should exist'

TEAM_RIVALS_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/rivals")"
assert_jq "$TEAM_RIVALS_JSON" '.success == true and (.data | length) >= 1' 'rivals should exist'

TEAM_STRATEGY_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/strategy")"
assert_jq "$TEAM_STRATEGY_JSON" '.success == true and .data.teamId == "'"$SMOKE_TEAM_ID"'" and .data.strategy != null' 'team strategy should exist'

TEAM_FORMATION_JSON="$(request GET "$BASE_URL/teams/$SMOKE_TEAM_ID/formation")"
assert_jq "$TEAM_FORMATION_JSON" '.success == true and .data.teamId == "'"$SMOKE_TEAM_ID"'" and .data.formation != null' 'team formation should exist'

echo "Checking tactical catalogs ..."
STRATEGIES_JSON="$(request GET "$BASE_URL/match/strategies")"
assert_jq "$STRATEGIES_JSON" '.success == true and (.data | length) >= 1' 'strategies catalog should exist'

FORMATIONS_JSON="$(request GET "$BASE_URL/match/formations")"
assert_jq "$FORMATIONS_JSON" '.success == true and (.data | length) >= 1' 'formations catalog should exist'

MESSAGE_TYPES_JSON="$(request GET "$BASE_URL/match/message-types")"
assert_jq "$MESSAGE_TYPES_JSON" '.success == true and (.data | length) >= 1 and (.data | index("RESULT")) != null' 'message types catalog should exist'

echo "Starting final ..."
START_JSON="$(request POST "$BASE_URL/match/start-final" '{"teamId":"'"$SMOKE_TEAM_ID"'"}')"
assert_jq "$START_JSON" '.success == true and (.data.options | length) == 4 and .data.isFinished == false and .data.eventType == "KICKOFF_EVENT" and .data.zone == "MIDFIELD" and .data.possession == "USER" and .data.ballCarrier != null and .data.teamFormation != null and .data.teamStrategy != null' 'start-final should return active kickoff state'
MATCH_ID="$(extract_required "$START_JSON" '.data.matchId')"

echo "Checking current squad endpoint ..."
CURRENT_SQUAD_JSON="$(request GET "$BASE_URL/match/current/squad")"
assert_jq "$CURRENT_SQUAD_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and (.data.team.starters | length) >= 1 and (.data.team.onField | length) >= 3 and (.data.team.onField[0].shirtNumber | type) == "number" and (.data.team.onField[0].age | type) == "number"' 'current squad should include players on field with shirt number and age'

echo "Checking squad by id endpoint ..."
BY_ID_SQUAD_JSON="$(request GET "$BASE_URL/match/$MATCH_ID/squad")"
assert_jq "$BY_ID_SQUAD_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and .data.team.remainingSubstitutions >= 0' 'squad by id should return substitution metadata'

echo "Checking current lineups endpoint ..."
CURRENT_LINEUPS_JSON="$(request GET "$BASE_URL/match/current/lineups")"
assert_jq "$CURRENT_LINEUPS_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and .data.team.onFieldCount >= 3 and (.data.team.onField | length) == .data.team.onFieldCount' 'current lineups should include on-field players only'

echo "Checking lineups by id endpoint ..."
BY_ID_LINEUPS_JSON="$(request GET "$BASE_URL/match/$MATCH_ID/lineups")"
assert_jq "$BY_ID_LINEUPS_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and .data.opponent.onFieldCount >= 3 and (.data.opponent.onField | length) == .data.opponent.onFieldCount' 'lineups by id should return on-field players only'

echo "Selecting strategy ..."
STRATEGY_JSON="$(request POST "$BASE_URL/match/select-strategy" '{"teamId":"'"$SMOKE_TEAM_ID"'","strategy":"BALANCED"}')"
assert_jq "$STRATEGY_JSON" '.success == true and .data.teamId == "'"$SMOKE_TEAM_ID"'" and .data.strategy == "BALANCED"' 'strategy should be saved'

echo "Selecting formation ..."
FORMATION_JSON="$(request POST "$BASE_URL/match/select-formation" '{"teamId":"'"$SMOKE_TEAM_ID"'","formation":"4-2-3-1"}')"
assert_jq "$FORMATION_JSON" '.success == true and .data.teamId == "'"$SMOKE_TEAM_ID"'" and .data.formation == "4-2-3-1"' 'formation should be saved'

echo "Playing one turn (selectedOption=1) ..."
PLAY_JSON="$(request POST "$BASE_URL/match/play" '{"selectedOption":1}')"
assert_jq "$PLAY_JSON" '.success == true and .data.matchId != null and .data.turn >= 2 and .data.zone != null and .data.possession != null and .data.ballCarrier != null' 'play should advance match with narrative fields'

echo "Advancing until half-time ..."
HALF_TIME_JSON=""
for _ in $(seq 1 10); do
  TURN_JSON="$(request POST "$BASE_URL/match/play" '{"selectedOption":1}')"
  TURN_EVENT_TYPE="$(echo "$TURN_JSON" | jq -r '.data.eventType // empty')"
  if [[ "$TURN_EVENT_TYPE" == "HALF_TIME_EVENT" ]]; then
    HALF_TIME_JSON="$TURN_JSON"
    break
  fi
done

if [[ -z "$HALF_TIME_JSON" ]]; then
  echo "Expected HALF_TIME_EVENT but it was not reached in smoke test." >&2
  echo "$TURN_JSON" | jq >&2 || echo "$TURN_JSON" >&2
  exit 1
fi

assert_jq "$HALF_TIME_JSON" '.success == true and .data.isFinished == false and (.data.options | length) == 2 and (.data.options | map(.action) | index("RESTART_MATCH")) != null and (.data.options | map(.action) | index("QUIT_MATCH")) != null' 'half-time should expose restart and quit options'

RESTART_OPTION_INDEX="$(echo "$HALF_TIME_JSON" | jq -r '.data.options[] | select(.action == "RESTART_MATCH") | .index' | head -n 1)"
if [[ -z "$RESTART_OPTION_INDEX" || "$RESTART_OPTION_INDEX" == "null" ]]; then
  echo "Failed to resolve RESTART_MATCH option index at half-time." >&2
  echo "$HALF_TIME_JSON" | jq >&2 || echo "$HALF_TIME_JSON" >&2
  exit 1
fi

echo "Restarting second half and validating rival kickoff ..."
SECOND_HALF_JSON="$(request POST "$BASE_URL/match/play" '{"selectedOption":'"$RESTART_OPTION_INDEX"'}')"
assert_jq "$SECOND_HALF_JSON" '.success == true and .data.isFinished == false and .data.eventType == "KICKOFF_EVENT" and .data.possession == "OPPONENT" and .data.minute >= 46 and .data.ballCarrier != null' 'second half should restart with opponent kickoff'

echo "Checking match stats endpoints ..."
CURRENT_STATS_JSON="$(request GET "$BASE_URL/match/current/stats")"
assert_jq "$CURRENT_STATS_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and .data.summary != null and (.data.events | length) >= 1' 'current stats should exist for active match'

BY_ID_STATS_JSON="$(request GET "$BASE_URL/match/$MATCH_ID/stats")"
assert_jq "$BY_ID_STATS_JSON" '.success == true and .data.matchId == "'"$MATCH_ID"'" and (.data.events | length) >= 1' 'stats by id should return timeline'

echo "Quitting match (selectedOption=4) ..."
QUIT_JSON="$(request POST "$BASE_URL/match/play" '{"selectedOption":4}')"
assert_jq "$QUIT_JSON" '.success == true and .data.isFinished == true and .data.eventType == "FORFEIT_EVENT"' 'quit_match should finish match as forfeit'

echo "Starting final again after forfeit ..."
RESTART_JSON="$(request POST "$BASE_URL/match/start-final" '{"teamId":"'"$SMOKE_TEAM_ID"'"}')"
NEW_MATCH_ID="$(extract_required "$RESTART_JSON" '.data.matchId')"

if [[ "$NEW_MATCH_ID" == "$MATCH_ID" ]]; then
  echo "Expected a new match id after abandoning previous match." >&2
  echo "$RESTART_JSON" | jq >&2 || echo "$RESTART_JSON" >&2
  exit 1
fi

echo "Checking historic finals ids ..."
HISTORIC_FINALS_JSON="$(request GET "$BASE_URL/match/historic-finals")"
assert_jq "$HISTORIC_FINALS_JSON" '.success == true and (.data | index("'"$MATCH_ID"'")) != null and (.data | index("'"$NEW_MATCH_ID"'")) == null' 'historic finals should include finished ids and exclude active one'

echo "All smoke tests passed for World Cup API."
