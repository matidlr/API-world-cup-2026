import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AppHeaderComponent } from './shared/layout/app-header.component';
import { TopbarComponent } from './shared/layout/topbar.component';
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

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    AppHeaderComponent,
    TopbarComponent,
    SquadPageComponent,
    CoachingPageComponent,
    TeamHistoryPageComponent,
    RivalsPageComponent,
    GroupsPageComponent,
    JourneyPageComponent,
    SimulatePageComponent,
    MatchesPageComponent,
    WorldCupStatsPageComponent,
    WorldCupHistoryPageComponent,
    LiveEventsPageComponent,
    TeamStatePageComponent,
    FinalChatPageComponent,
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
