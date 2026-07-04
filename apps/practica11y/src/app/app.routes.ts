import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'challenges',
    loadComponent: () =>
      import('./challenges-page/challenges-page').then((m) => m.ChallengesPage),
  },
  {
    path: 'challenges/:id',
    loadComponent: () =>
      import('./challenge-detail-page/challenge-detail-page').then(
        (m) => m.ChallengeDetailPage,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about-page/about-page').then((m) => m.AboutPage),
  },
];
