import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Seo } from '@practica11y/util';

@Component({
  selector: 'app-about-page',
  imports: [RouterModule],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  private readonly seo = inject(Seo);

  protected readonly licensesText = signal<string | null>(null);
  protected readonly licensesLoading = signal(false);
  protected readonly licensesError = signal(false);

  constructor() {
    this.seo.update({
      title: 'About',
      description:
        'Learn about Practica11y — a free, gamified, browser-based platform that helps developers practice web accessibility and master WCAG 2.2.',
      path: '/about',
    });
  }

  protected async loadLicenses(): Promise<void> {
    if (this.licensesText() !== null) {
      return;
    }

    this.licensesLoading.set(true);
    this.licensesError.set(false);

    try {
      const response = await fetch('3rdpartylicenses.txt');
      if (!response.ok) {
        throw new Error(`Failed to load licenses: ${response.status}`);
      }
      this.licensesText.set(await response.text());
    } catch {
      this.licensesError.set(true);
    } finally {
      this.licensesLoading.set(false);
    }
  }
}
