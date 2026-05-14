#!/usr/bin/env node

const API_BASE = process.env.WC_API_BASE ?? 'http://127.0.0.1:5101/worldCup';
const SAMPLE_SIZE = Number.parseInt(process.argv[2] ?? process.env.SAMPLE_SIZE ?? '10', 10);

if (!Number.isFinite(SAMPLE_SIZE) || SAMPLE_SIZE <= 0) {
  console.error('SAMPLE_SIZE must be a positive integer.');
  process.exit(1);
}

const REPORT_DIR = new URL('./reports/', import.meta.url);

const headers = {
  'Content-Type': 'application/json',
};

async function request(path, method = 'GET', body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const details = json ? JSON.stringify(json) : text;
    throw new Error(`${method} ${path} failed (${response.status}): ${details}`);
  }

  if (json && typeof json === 'object' && 'data' in json) {
    return json.data;
  }

  return json;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function countMessage(items, matcher) {
  return items.filter((item) => matcher(item.text ?? '')).length;
}

function parseScore(score) {
  const [left, right] = (score ?? '0-0').split('-').map((value) => Number.parseInt(value, 10));
  return {
    teamGoals: Number.isFinite(left) ? left : 0,
    opponentGoals: Number.isFinite(right) ? right : 0,
  };
}

function normalizeOptionLabel(option) {
  return String(option?.action ?? option?.label ?? '').toUpperCase();
}

function choosePlayableOption(options) {
  const playable = options.filter((option) => normalizeOptionLabel(option) !== 'QUIT_MATCH');
  if (playable.length === 0) {
    return options[0] ?? null;
  }
  return pickRandom(playable);
}

function createMetrics() {
  return {
    shotsByUser: 0,
    shotsUserGoal: 0,
    shotsUserConcede: 0,
    defensiveActions: 0,
    defensiveConcede: 0,
    counterGoalMessages: 0,
    penaltyResolvedSameTurn: 0,
    rivalryTriggers: 0,
    turnsWithContext: 0,
    messageIdCounts: {},
    outcomeCodeCounts: {},
  };
}

function messageIdOf(item) {
  return item?.messageKey ?? item?.key ?? null;
}

function outcomeCodeOfMessageId(messageId) {
  if (!messageId) {
    return null;
  }
  const match = /^match\.turn\.result\.outcome\.([A-Z_]+)(?:\.\d+)?$/.exec(messageId);
  return match?.[1] ?? null;
}

function registerMessageIds(items, target) {
  for (const item of items) {
    const messageId = messageIdOf(item);
    if (!messageId) {
      continue;
    }
    target[messageId] = (target[messageId] ?? 0) + 1;
  }
}

function registerOutcomeCodes(items, target) {
  for (const item of items) {
    const outcomeCode = outcomeCodeOfMessageId(messageIdOf(item));
    if (!outcomeCode) {
      continue;
    }
    target[outcomeCode] = (target[outcomeCode] ?? 0) + 1;
  }
}

function mapTeamSnapshot(team) {
  if (!team) {
    return null;
  }

  return {
    id: team.id ?? null,
    name: team.name ?? null,
    strategy: team.strategy ?? null,
    formation: team.formation ?? null,
    onFieldCount: team.onFieldCount ?? null,
    substitutionsUsed: team.substitutionsUsed ?? null,
    remainingSubstitutions: team.remainingSubstitutions ?? null,
    tacticalBreakdown: {
      baseTeamLine: team.tacticalBreakdown?.baseTeamLine ?? null,
      lineBoost: team.tacticalBreakdown?.lineBoost ?? null,
      compatibilityPenaltyPoints: team.tacticalBreakdown?.compatibilityPenaltyPoints ?? null,
      effectiveTeamLine: team.tacticalBreakdown?.effectiveTeamLine ?? null,
    },
  };
}

async function fetchSquadSnapshot(matchId) {
  const squad = await request(`/match/${matchId}/squad`);
  return {
    minute: squad?.minute ?? null,
    turn: squad?.turn ?? null,
    score: squad?.score ?? null,
    team: mapTeamSnapshot(squad?.team),
    opponent: mapTeamSnapshot(squad?.opponent),
  };
}

function updateMetrics(metrics, selectedAction, previousScore, currentScore, messageItems) {
  const action = normalizeOptionLabel(selectedAction);

  if (action === 'SHOOT') {
    metrics.shotsByUser += 1;
    if (currentScore.teamGoals > previousScore.teamGoals) {
      metrics.shotsUserGoal += 1;
    }
    if (currentScore.opponentGoals > previousScore.opponentGoals) {
      metrics.shotsUserConcede += 1;
    }
  }

  if (['TACKLE', 'PRESS', 'DEFEND', 'BLOCK'].includes(action)) {
    metrics.defensiveActions += 1;
    if (currentScore.opponentGoals > previousScore.opponentGoals) {
      metrics.defensiveConcede += 1;
    }
  }

  metrics.counterGoalMessages += countMessage(
    messageItems,
    (text) => /counter|contraataque|contra ataque/i.test(text) && /goal|goool|gol/i.test(text),
  );

  const hasPenaltyWhistle = messageItems.some((item) => /penal/i.test(item.text ?? '') && /pita|pit|foul|falta/i.test(item.text ?? ''));
  const hasPenaltyResolution = messageItems.some((item) =>
    /penal/i.test(item.text ?? '') && /goal|goool|gol|save|ataja|atajó|miss|falla/i.test(item.text ?? ''),
  );
  if (hasPenaltyWhistle && hasPenaltyResolution) {
    metrics.penaltyResolvedSameTurn += 1;
  }

  const hasRivalryMessage = messageItems.some((item) => /rivalry|rivalidad/i.test(item.text ?? ''));
  if (hasRivalryMessage) {
    metrics.rivalryTriggers += 1;
  }
}

async function ensureNoActiveFinal() {
  const current = await request('/world-cup/current');
  if (!current?.hasActiveFinal) {
    return;
  }

  let safety = 500;
  while (safety > 0) {
    safety -= 1;
    const startFinal = await request('/match/start-final', 'POST', {});
    if (startFinal?.isFinished) {
      break;
    }

    const options = startFinal?.options ?? [];
    if (!options.length) {
      throw new Error('Active final has no options to continue.');
    }

    const selected = choosePlayableOption(options);
    const playResponse = await request('/match/play', 'POST', { selectedOption: selected.index });
    if (playResponse?.isFinished) {
      break;
    }
  }

  if (safety === 0) {
    throw new Error('Unable to finish active final before test run.');
  }
}

async function runSingleMatch(matchNo, teams) {
  const selectedTeam = pickRandom(teams);
  const simulate = await request('/world-cup/simulate', 'POST', { teamId: selectedTeam.id, lang: 'en' });

  const startFinal = await request('/match/start-final', 'POST', { teamId: selectedTeam.id, lang: 'en' });

  const metrics = createMetrics();
  const turnLogs = [];
  let current = startFinal;
  let lastSquadSnapshot = await fetchSquadSnapshot(startFinal.matchId);
  let turns = 0;

  while (!current.isFinished) {
    turns += 1;

    const options = current.options ?? [];
    if (!options.length) {
      throw new Error(`Match ${current.matchId} has no options before finish.`);
    }

    const selected = choosePlayableOption(options);
    if (!selected) {
      throw new Error(`Match ${current.matchId} could not select an option.`);
    }

    const previousScore = parseScore(current.score);
    const played = await request('/match/play', 'POST', { selectedOption: selected.index, lang: 'en' });
    const squadSnapshot = await fetchSquadSnapshot(played.matchId);
    const currentScore = parseScore(played.score);
    const currentMessages = played.messageItems ?? [];

    if (played.currentContext) {
      metrics.turnsWithContext += 1;
    }

    updateMetrics(metrics, selected, previousScore, currentScore, currentMessages);
    registerMessageIds(currentMessages, metrics.messageIdCounts);
    registerOutcomeCodes(currentMessages, metrics.outcomeCodeCounts);

    turnLogs.push({
      turnNo: turns,
      selectedOption: {
        index: selected.index,
        action: selected.action ?? null,
        label: selected.label ?? null,
      },
      before: {
        score: current.score ?? null,
        minute: current.minute ?? null,
        eventType: current.eventType ?? null,
        possession: current.possession ?? null,
        zone: current.zone ?? null,
        ballCarrier: current.ballCarrier ?? null,
      },
      after: {
        score: played.score ?? null,
        minute: played.minute ?? null,
        eventType: played.eventType ?? null,
        possession: played.possession ?? null,
        zone: played.zone ?? null,
        ballCarrier: played.ballCarrier ?? null,
        isFinished: Boolean(played.isFinished),
      },
      context: {
        before: current.currentContext ?? null,
        applied: played.currentContext ?? null,
      },
      squad: {
        before: lastSquadSnapshot,
        after: squadSnapshot,
      },
      hasRivalryMessage: currentMessages.some((item) => /rivalry|rivalidad/i.test(item.text ?? '')),
      messages: currentMessages.map((item) => ({
        messageId: messageIdOf(item),
        outcomeCode: outcomeCodeOfMessageId(messageIdOf(item)),
        type: item.type ?? null,
        text: item.text ?? '',
        minute: item.minute ?? null,
        turn: item.turn ?? null,
        teamId: item.teamId ?? null,
        teamName: item.teamName ?? null,
        playerName: item.playerName ?? null,
      })),
    });

    lastSquadSnapshot = squadSnapshot;
    current = played;

    if (turns > 200) {
      throw new Error(`Match ${current.matchId} exceeded 200 turns.`);
    }
  }

  return {
    matchNo,
    worldCupId: simulate?.id ?? null,
    matchId: current.matchId,
    teamId: current.teamId,
    teamName: current.teamName,
    opponentName: current.opponentName,
    finalScore: current.score,
    result: current.result,
    turns,
    metrics,
    startContext: startFinal.currentContext ?? null,
    turnLogs,
  };
}

function aggregate(matches) {
  const total = {
    totalShotsByUser: 0,
    totalShotsUserGoal: 0,
    totalShotsUserConcede: 0,
    totalDefensiveActions: 0,
    totalDefensiveConcede: 0,
    totalCounterGoalMessages: 0,
    totalPenaltyResolvedSameTurn: 0,
    totalRivalryTriggers: 0,
    totalTurnsWithContext: 0,
    totalTurns: 0,
    averageTurns: 0,
    messageIdCounts: {},
    topMessageIds: [],
    outcomeCodeCounts: {},
    topOutcomeCodes: [],
  };

  for (const match of matches) {
    total.totalShotsByUser += match.metrics.shotsByUser;
    total.totalShotsUserGoal += match.metrics.shotsUserGoal;
    total.totalShotsUserConcede += match.metrics.shotsUserConcede;
    total.totalDefensiveActions += match.metrics.defensiveActions;
    total.totalDefensiveConcede += match.metrics.defensiveConcede;
    total.totalCounterGoalMessages += match.metrics.counterGoalMessages;
    total.totalPenaltyResolvedSameTurn += match.metrics.penaltyResolvedSameTurn;
    total.totalRivalryTriggers += match.metrics.rivalryTriggers;
    total.totalTurnsWithContext += match.metrics.turnsWithContext;
    total.totalTurns += match.turns;

    for (const [messageId, count] of Object.entries(match.metrics.messageIdCounts ?? {})) {
      total.messageIdCounts[messageId] = (total.messageIdCounts[messageId] ?? 0) + count;
    }
    for (const [outcomeCode, count] of Object.entries(match.metrics.outcomeCodeCounts ?? {})) {
      total.outcomeCodeCounts[outcomeCode] = (total.outcomeCodeCounts[outcomeCode] ?? 0) + count;
    }
  }

  total.averageTurns = matches.length ? Number((total.totalTurns / matches.length).toFixed(2)) : 0;
  total.topMessageIds = Object.entries(total.messageIdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([messageId, count]) => ({ messageId, count }));
  total.topOutcomeCodes = Object.entries(total.outcomeCodeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([outcomeCode, count]) => ({ outcomeCode, count }));
  return total;
}

async function main() {
  await import('node:fs/promises');
  const { mkdir, writeFile } = await import('node:fs/promises');

  const teams = await request('/teams');
  if (!Array.isArray(teams) || teams.length === 0) {
    throw new Error('No teams returned by /teams endpoint.');
  }

  await ensureNoActiveFinal();

  const matches = [];
  for (let i = 1; i <= SAMPLE_SIZE; i += 1) {
    const summary = await runSingleMatch(i, teams);
    matches.push(summary);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sampleSize: SAMPLE_SIZE,
    matches,
    aggregate: aggregate(matches),
  };

  await mkdir(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = new URL(`random_${SAMPLE_SIZE}_matches_${stamp}.json`, REPORT_DIR);
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify({
    ok: true,
    sampleSize: SAMPLE_SIZE,
    reportPath: outPath.pathname,
    aggregate: report.aggregate,
  }, null, 2));
}

main().catch((error) => {
  console.error('[run-random-finals] failed:', error.message);
  process.exit(1);
});
