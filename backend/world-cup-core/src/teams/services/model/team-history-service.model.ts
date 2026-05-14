export class TeamHistoryTitleItemModel {
  public org: string;
  public tournament: string;
  public count: number;
  public years: string[];
  public hosts: string[];
  public label: string;

  constructor(data: {
    org: string;
    tournament: string;
    count: number;
    years: string[];
    hosts: string[];
    label: string;
  }) {
    this.org = data.org;
    this.tournament = data.tournament;
    this.count = data.count;
    this.years = data.years;
    this.hosts = data.hosts;
    this.label = data.label;
  }
}

export class TeamHistorySectionModel {
  public key: string;
  public title: string;
  public count: number;
  public chips: string[];

  constructor(data: {
    key: string;
    title: string;
    count: number;
    chips: string[];
  }) {
    this.key = data.key;
    this.title = data.title;
    this.count = data.count;
    this.chips = data.chips;
  }
}

export class TeamHistoryScreenModel {
  public teamId: string;
  public totalTitles: number;
  public totalCompetitions: number;
  public organizations: string[];
  public titles: TeamHistoryTitleItemModel[];
  public sections: TeamHistorySectionModel[];

  constructor(data: {
    teamId: string;
    totalTitles: number;
    totalCompetitions: number;
    organizations: string[];
    titles: TeamHistoryTitleItemModel[];
    sections: TeamHistorySectionModel[];
  }) {
    this.teamId = data.teamId;
    this.totalTitles = data.totalTitles;
    this.totalCompetitions = data.totalCompetitions;
    this.organizations = data.organizations;
    this.titles = data.titles;
    this.sections = data.sections;
  }
}
