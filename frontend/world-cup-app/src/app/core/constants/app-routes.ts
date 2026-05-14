export const APP_ROUTES = {
  default: 'my-team/squad',
  myTeam: {
    squad: 'my-team/squad',
    coaching: 'my-team/coaching',
    history: 'my-team/history',
    rivals: 'my-team/rivals',
  },
  worldCup: {
    groups: 'world-cup/groups',
    journey: 'world-cup/journey',
    simulate: 'world-cup/simulate',
    matches: 'world-cup/matches',
    stats: 'world-cup/stats',
    history: 'world-cup/history',
  },
  finalMatch: {
    live: 'play-final/live',
    teamState: 'play-final/team-state',
    chat: 'play-final/chat',
  },
} as const;
