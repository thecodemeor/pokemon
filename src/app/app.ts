import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import packageJson from '../../package.json'
import { ResponsiveService } from 'src/app/services/responsive.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly responsive = inject(ResponsiveService);
  readonly screen = computed(() => this.responsive.breakpoint());

  protected readonly title = signal('pokemon');

  version: string = packageJson.version
  licenseYear: number = 2026
  navbar = ['pokemon', 'type', 'draw']
}