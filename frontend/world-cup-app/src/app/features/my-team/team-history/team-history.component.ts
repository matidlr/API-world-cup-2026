import { Component, OnInit } from '@angular/core';
import { TeamHistoryService } from './service/team-history.service';
import { TeamHistoryViewModel } from './model/team-history-view-model.interface';

@Component({
  selector: 'app-team-history-page',
  standalone: false,
  templateUrl: './team-history.component.html',
  styleUrls: ['./team-history.component.css'],
})
export class TeamHistoryPageComponent implements OnInit {
  constructor(private readonly pageService: TeamHistoryService) {}

  get pageState(): TeamHistoryViewModel {
    return this.pageService.getViewModel();
  }

  ngOnInit(): void {
    this.pageService.initialize();
  }

  getTitlesBadge(count: number): string {
    return `${count} títulos`;
  }
}
