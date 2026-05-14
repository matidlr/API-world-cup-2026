import { Component, Input } from '@angular/core';
import { APP_ROUTES } from '../../core/constants/app-routes';

interface NavItem {
  id: string;
  route: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false,
})
export class SidebarComponent {
  @Input() teamName = 'Argentina';
  @Input() teamFlag = '⚽';

  readonly sections: NavSection[] = [
    {
      title: 'Mi equipo',
      items: [
        { id: 'squad', route: APP_ROUTES.myTeam.squad, label: 'Plantel', icon: '👥' },
        { id: 'coaching', route: APP_ROUTES.myTeam.coaching, label: 'Cuerpo técnico', icon: '📋' },
        { id: 'history', route: APP_ROUTES.myTeam.history, label: 'Historia del equipo', icon: '🏆' },
        { id: 'rivals', route: APP_ROUTES.myTeam.rivals, label: 'Rivales históricos', icon: '⚔️' },
      ],
    },
    {
      title: 'Mundial',
      items: [
        { id: 'simulate', route: APP_ROUTES.worldCup.simulate, label: 'Simular final', icon: '⚡' },
        { id: 'groups', route: APP_ROUTES.worldCup.groups, label: 'Fase de grupos', icon: '📊' },
        { id: 'journey', route: APP_ROUTES.worldCup.journey, label: 'Camino del equipo', icon: '🗺️' },
        { id: 'matches', route: APP_ROUTES.worldCup.matches, label: 'Partidos', icon: '📅' },
        { id: 'stats', route: APP_ROUTES.worldCup.stats, label: 'Estadísticas', icon: '🥇' },
        { id: 'history-wc', route: APP_ROUTES.worldCup.history, label: 'Historial de mundiales', icon: '📜' },
      ],
    },
    {
      title: 'Final',
      items: [
        { id: 'live', route: APP_ROUTES.finalMatch.live, label: 'Eventos en vivo', icon: '📡' },
        { id: 'team-state', route: APP_ROUTES.finalMatch.teamState, label: 'Estado del equipo', icon: '🎽' },
        { id: 'chat', route: APP_ROUTES.finalMatch.chat, label: 'Jugar la final', icon: '🎮' },
      ],
    },
  ];
}
