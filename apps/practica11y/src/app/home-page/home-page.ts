import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '@practica11y/util';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly seo = inject(Seo);

  ngOnInit(): void {
    this.seo.update({
      title: 'Practica11y – Learn Web Accessibility by Doing',
      description:
        'Gamified, browser-based challenges that turn WCAG guidelines into hands-on practice for developers.',
      path: '/',
    });
  }
}
