import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_ROUTES } from './core/constants/app-routes';
import { SquadPageComponent } from './features/my-team/squad/squad.component';
import { CoachingPageComponent } from './features/my-team/coaching/coaching.component';
import { TeamHistoryPageComponent } from './features/my-team/team-history/team-history.component';
import { RivalsPageComponent } from './features/my-team/rivals/rivals.component';
import { GroupsPageComponent } from './features/world-cup/groups/groups.component';
import { JourneyPageComponent } from './features/world-cup/journey/journey.component';
import { SimulatePageComponent } from './features/world-cup/simulate/simulate.component';
import { MatchesPageComponent } from './features/world-cup/matches/matches.component';
import { WorldCupStatsPageComponent } from './features/world-cup/stats/world-cup-stats.component';
import { WorldCupHistoryPageComponent } from './features/world-cup/history/world-cup-history.component';
import { LiveEventsPageComponent } from './features/play-final/live-events/live-events.component';
import { TeamStatePageComponent } from './features/play-final/team-state/team-state.component';
import { FinalChatPageComponent } from './features/play-final/final-chat/final-chat.component';

const routes: Routes = [
  {
    path: APP_ROUTES.myTeam.squad,
    component: SquadPageComponent,
    data: {
      titleKey: 'route.myTeam.squad.title',
      subtitleKey: 'route.myTeam.squad.subtitle',
      viewId: 'squad',
    },
  },
  {
    path: APP_ROUTES.myTeam.coaching,
    component: CoachingPageComponent,
    data: {
      titleKey: 'route.myTeam.coaching.title',
      subtitleKey: 'route.myTeam.coaching.subtitle',
      viewId: 'coaching',
    },
  },
  {
    path: APP_ROUTES.myTeam.history,
    component: TeamHistoryPageComponent,
    data: {
      titleKey: 'route.myTeam.history.title',
      subtitleKey: 'route.myTeam.history.subtitle',
      viewId: 'history',
    },
  },
  {
    path: APP_ROUTES.myTeam.rivals,
    component: RivalsPageComponent,
    data: {
      titleKey: 'route.myTeam.rivals.title',
      subtitleKey: 'route.myTeam.rivals.subtitle',
      viewId: 'rivals',
    },
  },
  {
    path: APP_ROUTES.worldCup.groups,
    component: GroupsPageComponent,
    data: {
      titleKey: 'route.worldCup.groups.title',
      subtitleKey: 'route.worldCup.groups.subtitle',
      viewId: 'groups',
    },
  },
  {
    path: APP_ROUTES.worldCup.journey,
    component: JourneyPageComponent,
    data: {
      titleKey: 'route.worldCup.journey.title',
      subtitleKey: 'route.worldCup.journey.subtitle',
      viewId: 'journey',
    },
  },
  {
    path: APP_ROUTES.worldCup.simulate,
    component: SimulatePageComponent,
    data: {
      titleKey: 'route.worldCup.simulate.title',
      subtitleKey: 'route.worldCup.simulate.subtitle',
      viewId: 'simulate',
    },
  },
  {
    path: APP_ROUTES.worldCup.matches,
    component: MatchesPageComponent,
    data: {
      titleKey: 'route.worldCup.matches.title',
      subtitleKey: 'route.worldCup.matches.subtitle',
      viewId: 'matches',
    },
  },
  {
    path: APP_ROUTES.worldCup.stats,
    component: WorldCupStatsPageComponent,
    data: {
      titleKey: 'route.worldCup.stats.title',
      subtitleKey: 'route.worldCup.stats.subtitle',
      viewId: 'stats',
    },
  },
  {
    path: APP_ROUTES.worldCup.history,
    component: WorldCupHistoryPageComponent,
    data: {
      titleKey: 'route.worldCup.history.title',
      subtitleKey: 'route.worldCup.history.subtitle',
      viewId: 'history-wc',
    },
  },
  {
    path: APP_ROUTES.finalMatch.live,
    component: LiveEventsPageComponent,
    data: {
      titleKey: 'route.final.live.title',
      subtitleKey: 'route.final.live.subtitle',
      viewId: 'live',
    },
  },
  {
    path: APP_ROUTES.finalMatch.teamState,
    component: TeamStatePageComponent,
    data: {
      titleKey: 'route.final.teamState.title',
      subtitleKey: 'route.final.teamState.subtitle',
      viewId: 'team-state',
    },
  },
  {
    path: APP_ROUTES.finalMatch.chat,
    component: FinalChatPageComponent,
    data: {
      titleKey: 'route.final.chat.title',
      subtitleKey: 'route.final.chat.subtitle',
      viewId: 'chat',
    },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: APP_ROUTES.default,
  },
  {
    path: '**',
    redirectTo: APP_ROUTES.default,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
