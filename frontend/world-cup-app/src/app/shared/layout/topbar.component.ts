import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  standalone: false,
})
export class TopbarComponent {
  @Input() title = 'Plantel';
  @Input() subtitle = '';
  @Input() activeViewId = 'squad';
}
