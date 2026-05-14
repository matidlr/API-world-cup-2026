import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from './shared/admin/service/admin.service';
import { UiVisualsService } from './core/services/ui-visuals.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly destroyRef: DestroyRef,
    private readonly uiVisualsService: UiVisualsService,
  ) {}

  topbarTitle = 'Plantel';
  topbarSubtitle = 'Equipo seleccionado';
  activeViewId = 'squad';
  teamName = 'ARG';
  teamId = 'arg';
  lang: 'es' | 'en' = 'es';
  private topbarTitleKey = 'route.myTeam.squad.title';
  private topbarSubtitleKey = 'route.myTeam.squad.subtitle';

  private readonly routeLabels: Record<string, string> = {
    'route.myTeam.squad.title': 'Plantel',
    'route.myTeam.squad.subtitle': 'Nómina completa y detalles de jugadores',
    'route.myTeam.coaching.title': 'Cuerpo técnico',
    'route.myTeam.coaching.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.myTeam.history.title': 'Historia del Equipo',
    'route.myTeam.history.subtitle': 'Títulos internacionales',
    'route.myTeam.rivals.title': 'Rivales históricos',
    'route.myTeam.rivals.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.worldCup.simulate.title': 'Simular Final',
    'route.worldCup.simulate.subtitle': 'Iniciar y monitorear simulación de la final',
    'route.worldCup.groups.title': 'Fase de grupos',
    'route.worldCup.groups.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.worldCup.journey.title': 'Camino del equipo',
    'route.worldCup.journey.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.worldCup.matches.title': 'Partidos',
    'route.worldCup.matches.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.worldCup.stats.title': 'Estadísticas y premios',
    'route.worldCup.stats.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.worldCup.history.title': 'Historial de mundiales',
    'route.worldCup.history.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.final.live.title': 'Eventos en vivo',
    'route.final.live.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.final.teamState.title': 'Estado del equipo',
    'route.final.teamState.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.final.chat.title': 'Jugar la final',
    'route.final.chat.subtitle': 'Pendiente de desarrollo por el alumno',
    'route.fallback.title': 'World Cup 2026',
    'route.fallback.subtitle': 'Aplicación del trabajo práctico',
  };

  ngOnInit(): void {
    this.observeRouteData();
    this.observeAdminContext();

    this.adminService
      .initializeContext()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  get teamFlag(): string {
    return this.uiVisualsService.getTeamFlag(this.teamId);
  }

  private observeRouteData(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.getDeepestRoute(this.activatedRoute)),
        map((route) => route.snapshot.data),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.topbarTitleKey = data['titleKey'] ?? 'route.fallback.title';
        this.topbarSubtitleKey = data['subtitleKey'] ?? 'route.fallback.subtitle';
        this.activeViewId = data['viewId'] ?? 'squad';
        this.updateTopbarText();
      });
  }

  private observeAdminContext(): void {
    this.adminService.currentTeam$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((team) => {
        this.teamName = team?.name ?? 'ARG';
        this.teamId = (team?.teamId ?? 'arg').toLowerCase();
        this.updateTopbarText();
      });

    this.adminService.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.lang = lang === 'en' ? 'en' : 'es';
      });
  }

  private updateTopbarText(): void {
    this.topbarTitle = this.routeLabels[this.topbarTitleKey] ?? this.routeLabels['route.fallback.title'];
    const subtitleBase =
      this.routeLabels[this.topbarSubtitleKey] ?? this.routeLabels['route.fallback.subtitle'];
    this.topbarSubtitle = `${subtitleBase} · ${this.teamName}`;
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let currentRoute = route;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    return currentRoute;
  }
}
