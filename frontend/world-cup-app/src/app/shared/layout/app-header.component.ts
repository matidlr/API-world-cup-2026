import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
  standalone: false,
})
export class AppHeaderComponent {
  @Input() teamName = 'Argentina';
  @Input() lang: 'es' | 'en' = 'es';

  get langChip(): string {
    return this.lang.toUpperCase();
  }
}
