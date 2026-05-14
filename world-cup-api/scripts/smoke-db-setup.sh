#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_FILE="${1:-}"
SETUP_SQL_FILE="${SETUP_SQL_FILE:-$SCRIPT_DIR/smoke-db-setup.sql}"

if [[ -z "$DB_FILE" ]]; then
  echo "Usage: $0 <sqlite-db-file>" >&2
  exit 1
fi

if [[ ! -f "$SETUP_SQL_FILE" ]]; then
  echo "Missing setup SQL file: $SETUP_SQL_FILE" >&2
  exit 1
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
  if ! sqlite3 "$DB_FILE" "PRAGMA table_info(matches);" | awk -F'|' '{print $2}' | grep -qx "lastContextJson"; then
    sqlite3 "$DB_FILE" "ALTER TABLE matches ADD COLUMN lastContextJson text;"
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

sqlite3 "$DB_FILE" < "$SETUP_SQL_FILE"

if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='coaches';" | grep -qx "coaches"; then
  sqlite3 "$DB_FILE" <<'SQL'
DELETE FROM coaches;
INSERT INTO coaches (
  coachId,
  teamId,
  name,
  age,
  nationality,
  profile,
  riskAppetite,
  gameManagement,
  adaptability,
  pressingBias,
  possessionBias,
  defenseBias,
  maxStrategyChanges
)
SELECT
  'coach_' || teamId,
  teamId,
  coach,
  50,
  'Mockland',
  'BALANCED',
  55,
  65,
  65,
  55,
  55,
  55,
  3
FROM teams;
SQL
fi

echo "Smoke DB seeded at: $DB_FILE"
