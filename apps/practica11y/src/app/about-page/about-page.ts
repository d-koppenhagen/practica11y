import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  constructor() {
    this.seo.update({
      title: 'About',
      description:
        'Learn about Practica11y — a free, gamified, browser-based platform that helps developers practice web accessibility and master WCAG 2.2.',
      path: '/about',
    });
  }
}
