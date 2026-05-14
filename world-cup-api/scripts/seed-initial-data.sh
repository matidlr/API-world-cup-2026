#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ENV_FILE:-$API_DIR/.env}"
SCHEMA_SQL_FILE="${SCHEMA_SQL_FILE:-$SCRIPT_DIR/init-schema.sql}"
DATA_SQL_FILE="${DATA_SQL_FILE:-${SETUP_SQL_FILE:-$SCRIPT_DIR/seed-initial-data.sql}}"
RIVALS_SQL_FILE="${RIVALS_SQL_FILE:-${RELATED_SQL_FILE:-$SCRIPT_DIR/seed-team-rivals.sql}}"
PLAYERS_SQL_FILE="${PLAYERS_SQL_FILE:-$SCRIPT_DIR/seed-initial-team-players.sql}"
COACHES_SQL_FILE="${COACHES_SQL_FILE:-$SCRIPT_DIR/seed-initial-coaches.sql}"

if [[ ! -f "$SCHEMA_SQL_FILE" ]]; then
  echo "Missing schema SQL file: $SCHEMA_SQL_FILE" >&2
  exit 1
fi

if [[ ! -f "$DATA_SQL_FILE" ]]; then
  echo "Missing seed SQL file: $DATA_SQL_FILE" >&2
  exit 1
fi

if [[ ! -f "$RIVALS_SQL_FILE" ]]; then
  echo "Missing rivals SQL file: $RIVALS_SQL_FILE" >&2
  exit 1
fi

if [[ ! -f "$PLAYERS_SQL_FILE" ]]; then
  echo "Missing players seed SQL file: $PLAYERS_SQL_FILE" >&2
  exit 1
fi

if [[ ! -f "$COACHES_SQL_FILE" ]]; then
  echo "Missing coaches seed SQL file: $COACHES_SQL_FILE" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  DB_FILE="$1"
else
  DB_FILE_FROM_ENV_FILE=""
  if [[ -f "$ENV_FILE" ]]; then
    DB_FILE_FROM_ENV_FILE="$(
      grep -E '^DB_DATABASE=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- | sed 's/^"//; s/"$//'
    )"
  fi
  DB_FILE="${DB_DATABASE:-${DB_FILE_FROM_ENV_FILE:-$API_DIR/database/world_cup_api.db}}"
fi

mkdir -p "$(dirname "$DB_FILE")"

if [[ ! -f "$DB_FILE" ]]; then
  touch "$DB_FILE"
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='teams';" | grep -qx "teams"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(teams);" | awk -F'|' '{print $2}' | grep -qx "strategy"; then
    sqlite3 "$DB_FILE" "ALTER TABLE teams ADD COLUMN strategy varchar(32) NOT NULL DEFAULT 'ATTACK';"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(teams);" | awk -F'|' '{print $2}' | grep -qx "footballAssociation"; then
    sqlite3 "$DB_FILE" "ALTER TABLE teams ADD COLUMN footballAssociation varchar(16) NOT NULL DEFAULT 'UNASSIGNED';"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(teams);" | awk -F'|' '{print $2}' | grep -qx "formation"; then
    sqlite3 "$DB_FILE" "ALTER TABLE teams ADD COLUMN formation varchar(16) NOT NULL DEFAULT '4-3-3';"
  fi
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='coaches';" | grep -qx "coaches"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "age"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN age integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "nationality"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN nationality varchar(80) NOT NULL DEFAULT 'Unknown';"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "profile"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN profile varchar(32) NOT NULL DEFAULT 'BALANCED';"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "riskAppetite"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN riskAppetite integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "gameManagement"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN gameManagement integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "adaptability"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN adaptability integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "pressingBias"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN pressingBias integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "possessionBias"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN possessionBias integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "defenseBias"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN defenseBias integer NOT NULL DEFAULT 50;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(coaches);" | awk -F'|' '{print $2}' | grep -qx "maxStrategyChanges"; then
    sqlite3 "$DB_FILE" "ALTER TABLE coaches ADD COLUMN maxStrategyChanges integer NOT NULL DEFAULT 3;"
  fi
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='matches';" | grep -qx "matches"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "maxSubstitutions"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN maxSubstitutions integer NOT NULL DEFAULT 5;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "teamSubstitutionsUsed"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN teamSubstitutionsUsed integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentSubstitutionsUsed"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentSubstitutionsUsed integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentStrategyChangesUsed"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentStrategyChangesUsed integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "formation"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN formation varchar(16);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentStrategy"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentStrategy varchar(32);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentFormation"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentFormation varchar(16);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "teamMoraleBoostTurns"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN teamMoraleBoostTurns integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "teamMoralePenaltyTurns"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN teamMoralePenaltyTurns integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentMoraleBoostTurns"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentMoraleBoostTurns integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "opponentMoralePenaltyTurns"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN opponentMoralePenaltyTurns integer NOT NULL DEFAULT 0;"
  fi
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='world_cup_matches';" | grep -qx "world_cup_matches"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homePenaltyGoals"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homePenaltyGoals integer;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayPenaltyGoals"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayPenaltyGoals integer;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "playerOfMatchTeamId"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN playerOfMatchTeamId varchar(16);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "playerOfMatchTeamName"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN playerOfMatchTeamName varchar(120);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "playerOfMatchName"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN playerOfMatchName varchar(120);"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeTotalYellowCards"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeTotalYellowCards integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeTotalRedCards"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeTotalRedCards integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayTotalYellowCards"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayTotalYellowCards integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayTotalRedCards"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayTotalRedCards integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeGoalsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeGoalsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayGoalsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayGoalsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeCardsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeCardsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayCardsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayCardsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeInjuriesDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeInjuriesDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awayInjuriesDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awayInjuriesDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "homeSubstitutionsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN homeSubstitutionsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(world_cup_matches);" | awk -F'|' '{print $2}' | grep -qx "awaySubstitutionsDetailsJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE world_cup_matches ADD COLUMN awaySubstitutionsDetailsJson text NOT NULL DEFAULT ('[]');"
  fi
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='team_players';" | grep -qx "team_players"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "shirtNumber"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN shirtNumber integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "age"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN age integer NOT NULL DEFAULT 18;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "skill"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN skill integer NOT NULL DEFAULT 70;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "attack"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN attack integer NOT NULL DEFAULT 70;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "defense"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN defense integer NOT NULL DEFAULT 70;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(team_players);" | awk -F'|' '{print $2}' | grep -qx "energy"; then
    sqlite3 "$DB_FILE" "ALTER TABLE team_players ADD COLUMN energy integer NOT NULL DEFAULT 80;"
  fi
fi

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='match_squad';" | grep -qx "match_squad"; then
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(match_squad);" | awk -F'|' '{print $2}' | grep -qx "shirtNumber"; then
    sqlite3 "$DB_FILE" "ALTER TABLE match_squad ADD COLUMN shirtNumber integer NOT NULL DEFAULT 0;"
  fi
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(match_squad);" | awk -F'|' '{print $2}' | grep -qx "age"; then
    sqlite3 "$DB_FILE" "ALTER TABLE match_squad ADD COLUMN age integer NOT NULL DEFAULT 18;"
  fi
fi

sqlite3 "$DB_FILE" < "$SCHEMA_SQL_FILE"
sqlite3 "$DB_FILE" < "$DATA_SQL_FILE"
sqlite3 "$DB_FILE" < "$RIVALS_SQL_FILE"
sqlite3 "$DB_FILE" < "$PLAYERS_SQL_FILE"
sqlite3 "$DB_FILE" < "$COACHES_SQL_FILE"

echo "Initial world cup data seeded in: $DB_FILE"
echo "Schema applied from: $SCHEMA_SQL_FILE"
echo "Reference data applied from: $DATA_SQL_FILE"
echo "Rivalry matrix applied from: $RIVALS_SQL_FILE"
echo "Real team squads (23 players per team) seeded from: $PLAYERS_SQL_FILE"
echo "Coach profiles seeded from: $COACHES_SQL_FILE"
