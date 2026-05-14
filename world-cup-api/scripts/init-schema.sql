-- Database schema for World Cup API (idempotent)

CREATE TABLE IF NOT EXISTS teams (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  teamId varchar(16) PRIMARY KEY NOT NULL,
  name varchar(80) NOT NULL,
  groupName varchar(8) NOT NULL,
  footballAssociation varchar(16) NOT NULL DEFAULT ('UNASSIGNED'),
  rating integer NOT NULL,
  coach varchar(120) NOT NULL,
  captain varchar(120) NOT NULL,
  strategy varchar(32) NOT NULL DEFAULT ('ATTACK'),
  formation varchar(16) NOT NULL DEFAULT ('4-3-3')
);

CREATE TABLE IF NOT EXISTS coaches (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  coachId varchar(64) PRIMARY KEY NOT NULL,
  teamId varchar(16) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  age integer NOT NULL DEFAULT 50,
  nationality varchar(80) NOT NULL,
  profile varchar(32) NOT NULL DEFAULT ('BALANCED'),
  riskAppetite integer NOT NULL DEFAULT 50,
  gameManagement integer NOT NULL DEFAULT 50,
  adaptability integer NOT NULL DEFAULT 50,
  pressingBias integer NOT NULL DEFAULT 50,
  possessionBias integer NOT NULL DEFAULT 50,
  defenseBias integer NOT NULL DEFAULT 50,
  maxStrategyChanges integer NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS team_stats (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  statsId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  teamId varchar(16) NOT NULL UNIQUE,
  attack integer NOT NULL,
  defense integer NOT NULL,
  midfield integer NOT NULL,
  overall integer NOT NULL
);

CREATE TABLE IF NOT EXISTS team_players (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  playerId varchar(64) PRIMARY KEY NOT NULL,
  teamId varchar(16) NOT NULL,
  name varchar(120) NOT NULL,
  position varchar(8) NOT NULL,
  shirtNumber integer NOT NULL DEFAULT 0,
  age integer NOT NULL DEFAULT 18,
  skill integer NOT NULL DEFAULT 70,
  attack integer NOT NULL DEFAULT 70,
  defense integer NOT NULL DEFAULT 70,
  energy integer NOT NULL DEFAULT 80
);

CREATE TABLE IF NOT EXISTS team_history (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  historyId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  teamId varchar(16) NOT NULL UNIQUE,
  titlesJson text NOT NULL
);

CREATE TABLE IF NOT EXISTS team_rivals (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  rivalryId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  teamId varchar(16) NOT NULL,
  rivalTeamId varchar(16) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_tactics_defaults (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  teamId varchar(16) PRIMARY KEY NOT NULL,
  defaultStrategy varchar(32) NOT NULL DEFAULT ('ATTACK'),
  defaultFormation varchar(16) NOT NULL DEFAULT ('4-3-3')
);

CREATE TABLE IF NOT EXISTS matches (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  matchId varchar(64) PRIMARY KEY NOT NULL,
  teamId varchar(16) NOT NULL,
  teamName varchar(120) NOT NULL,
  opponentId varchar(16) NOT NULL,
  opponentName varchar(120) NOT NULL,
  scoreTeam integer NOT NULL DEFAULT 0,
  scoreOpponent integer NOT NULL DEFAULT 0,
  minute integer NOT NULL DEFAULT 1,
  turn integer NOT NULL DEFAULT 1,
  maxTurns integer NOT NULL DEFAULT 4,
  maxSubstitutions integer NOT NULL DEFAULT 5,
  teamSubstitutionsUsed integer NOT NULL DEFAULT 0,
  opponentSubstitutionsUsed integer NOT NULL DEFAULT 0,
  opponentStrategyChangesUsed integer NOT NULL DEFAULT 0,
  opponentLastTacticalChangeTurn integer NOT NULL DEFAULT 0,
  currentZone varchar(32) NOT NULL DEFAULT ('MIDFIELD'),
  possessionTeam varchar(16) NOT NULL DEFAULT ('USER'),
  ballCarrierTeamId varchar(16),
  ballCarrierName varchar(120),
  teamAttackPenalty integer NOT NULL DEFAULT 0,
  teamMidfieldPenalty integer NOT NULL DEFAULT 0,
  teamDefensePenalty integer NOT NULL DEFAULT 0,
  opponentAttackPenalty integer NOT NULL DEFAULT 0,
  opponentMidfieldPenalty integer NOT NULL DEFAULT 0,
  opponentDefensePenalty integer NOT NULL DEFAULT 0,
  teamMoraleBoostTurns integer NOT NULL DEFAULT 0,
  teamMoralePenaltyTurns integer NOT NULL DEFAULT 0,
  opponentMoraleBoostTurns integer NOT NULL DEFAULT 0,
  opponentMoralePenaltyTurns integer NOT NULL DEFAULT 0,
  strategy varchar(32),
  formation varchar(16),
  opponentStrategy varchar(32),
  opponentFormation varchar(16),
  eventType varchar(32) NOT NULL DEFAULT ('KICKOFF_EVENT'),
  message varchar(280) NOT NULL DEFAULT (''),
  optionsJson text NOT NULL DEFAULT ('[]'),
  lastContextJson text,
  isFinished boolean NOT NULL DEFAULT 0,
  isActive boolean NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS match_stats (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  statId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  matchId varchar(64) NOT NULL,
  turn integer NOT NULL DEFAULT 1,
  minute integer NOT NULL DEFAULT 1,
  eventType varchar(32) NOT NULL DEFAULT ('KICKOFF_EVENT'),
  zone varchar(24),
  action varchar(32),
  teamId varchar(16),
  teamName varchar(120),
  playerId varchar(64),
  playerName varchar(120),
  playerPosition varchar(8),
  cardType varchar(16),
  isGoal boolean NOT NULL DEFAULT 0,
  message varchar(280) NOT NULL DEFAULT ('')
);

CREATE TABLE IF NOT EXISTS match_squad (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  squadId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  matchId varchar(64) NOT NULL,
  teamId varchar(16) NOT NULL,
  playerId varchar(64) NOT NULL,
  playerName varchar(120) NOT NULL,
  position varchar(8) NOT NULL,
  shirtNumber integer NOT NULL DEFAULT 0,
  age integer NOT NULL DEFAULT 18,
  skill integer NOT NULL DEFAULT 70,
  attack integer NOT NULL DEFAULT 70,
  defense integer NOT NULL DEFAULT 70,
  energy integer NOT NULL DEFAULT 80,
  isCaptain boolean NOT NULL DEFAULT 0,
  isStarter boolean NOT NULL DEFAULT 0,
  isOnField boolean NOT NULL DEFAULT 0,
  yellowCards integer NOT NULL DEFAULT 0,
  redCard boolean NOT NULL DEFAULT 0,
  isInjured boolean NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS world_cups (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  worldCupId varchar(64) PRIMARY KEY NOT NULL,
  edition integer NOT NULL DEFAULT 2026,
  status varchar(32) NOT NULL DEFAULT ('READY_FOR_FINAL'),
  isCurrent boolean NOT NULL DEFAULT 1,
  selectedTeamId varchar(16) NOT NULL,
  selectedTeamName varchar(120) NOT NULL,
  finalHomeTeamId varchar(16) NOT NULL,
  finalHomeTeamName varchar(120) NOT NULL,
  finalAwayTeamId varchar(16) NOT NULL,
  finalAwayTeamName varchar(120) NOT NULL,
  finalMatchId varchar(64),
  notesJson text NOT NULL DEFAULT ('[]')
);

CREATE TABLE IF NOT EXISTS world_cup_group_standings (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  standingId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  worldCupId varchar(64) NOT NULL,
  groupName varchar(2) NOT NULL,
  teamId varchar(16) NOT NULL,
  teamName varchar(120) NOT NULL,
  confederation varchar(16) NOT NULL,
  played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  goalsFor integer NOT NULL DEFAULT 0,
  goalsAgainst integer NOT NULL DEFAULT 0,
  goalDifference integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 4,
  isQualified boolean NOT NULL DEFAULT 0,
  isBestThird boolean NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS world_cup_matches (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  worldCupMatchId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  worldCupId varchar(64) NOT NULL,
  stage varchar(32) NOT NULL,
  groupName varchar(2),
  matchCode varchar(64) NOT NULL,
  homeTeamId varchar(16) NOT NULL,
  homeTeamName varchar(120) NOT NULL,
  awayTeamId varchar(16) NOT NULL,
  awayTeamName varchar(120) NOT NULL,
  homeGoals integer,
  awayGoals integer,
  homePenaltyGoals integer,
  awayPenaltyGoals integer,
  winnerTeamId varchar(16),
  winnerTeamName varchar(120),
  resolution varchar(32) NOT NULL DEFAULT ('PENDING'),
  isPending boolean NOT NULL DEFAULT 0,
  playerOfMatchTeamId varchar(16),
  playerOfMatchTeamName varchar(120),
  playerOfMatchName varchar(120),
  homeTotalYellowCards integer NOT NULL DEFAULT 0,
  homeTotalRedCards integer NOT NULL DEFAULT 0,
  awayTotalYellowCards integer NOT NULL DEFAULT 0,
  awayTotalRedCards integer NOT NULL DEFAULT 0,
  homeGoalsDetailsJson text NOT NULL DEFAULT ('[]'),
  awayGoalsDetailsJson text NOT NULL DEFAULT ('[]'),
  homeCardsDetailsJson text NOT NULL DEFAULT ('[]'),
  awayCardsDetailsJson text NOT NULL DEFAULT ('[]'),
  homeInjuriesDetailsJson text NOT NULL DEFAULT ('[]'),
  awayInjuriesDetailsJson text NOT NULL DEFAULT ('[]'),
  homeSubstitutionsDetailsJson text NOT NULL DEFAULT ('[]'),
  awaySubstitutionsDetailsJson text NOT NULL DEFAULT ('[]')
);

CREATE TABLE IF NOT EXISTS world_cup_player_stats (
  creationDate datetime NOT NULL DEFAULT (datetime('now')),
  lastUpdate datetime NOT NULL DEFAULT (datetime('now')),
  playerStatId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  worldCupId varchar(64) NOT NULL,
  teamId varchar(16) NOT NULL,
  teamName varchar(120) NOT NULL,
  playerId varchar(64) NOT NULL,
  playerName varchar(120) NOT NULL,
  position varchar(8) NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  cleanSheets integer NOT NULL DEFAULT 0,
  yellowCards integer NOT NULL DEFAULT 0,
  redCards integer NOT NULL DEFAULT 0,
  minutesPlayed integer NOT NULL DEFAULT 0,
  playerOfMatch integer NOT NULL DEFAULT 0
);
