import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ChallengeLoader } from '@practica11y/loader';
import { ChallengeShell } from '@practica11y/challenge-shell';
import { Challenge } from '@practica11y/models';
import { ErrorService } from '@practica11y/util';

@Component({
  selector: 'app-challenge-detail-page',
  imports: [ChallengeShell],
  template: `
    @if (challenge(); as c) {
      <a11y-challenge-shell [challenge]="c" />
    } @else if (loading()) {
      <p class="text-gray-600 p-4">Loading challenge…</p>
    } @else if (error()) {
      <p class="text-red-600 p-4" role="alert">{{ error() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeDetailPage {
  readonly id = input.required<string>();

  private readonly challengeLoader = inject(ChallengeLoader);
  private readonly errorService = inject(ErrorService);

  protected readonly challenge = signal<Challenge | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      this.loadChallenge(id);
    });
  }

  private async loadChallenge(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.challenge.set(null);

    if (!id) {
      const message = 'No challenge ID provided.';
      this.error.set(message);
      this.errorService.addError({
        id: 'challenge-no-id',
        category: 'challenge',
        message,
        recoverable: false,
        timestamp: new Date(),
      });
      this.loading.set(false);
      return;
    }

    try {
      const loaded = await this.challengeLoader.loadChallenge(id);
      this.challenge.set(loaded);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load challenge.';
      this.error.set(message);
      this.errorService.addError({
        id: `challenge-load-${id}-${Date.now()}`,
        category: 'challenge',
        message,
        recoverable: true,
        timestamp: new Date(),
      });
    } finally {
      this.loading.set(false);
    }
  }
}
