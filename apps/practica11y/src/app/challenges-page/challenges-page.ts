import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeLoader } from '@practica11y/loader';
import { ChallengeList } from '@practica11y/challenge-list';
import { ErrorService, ProgressStore } from '@practica11y/util';
import { Challenge } from '@practica11y/models';

@Component({
  selector: 'app-challenges-page',
  imports: [ChallengeList],
  template: `
    <h1 class="text-2xl font-bold mb-6">Challenges</h1>
    @if (loadError()) {
      <p
        class="text-red-600 p-4 mb-4 border border-red-200 rounded"
        role="alert"
      >
        {{ loadError() }}
      </p>
    }
    <a11y-challenge-list
      [challenges]="challenges()"
      [completedChallengeIds]="completedChallengeIds()"
      (challengeSelected)="onChallengeSelected($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly challengeLoader = inject(ChallengeLoader);
  private readonly progressStore = inject(ProgressStore);
  private readonly errorService = inject(ErrorService);

  protected readonly challenges = signal<Challenge[]>([]);
  protected readonly completedChallengeIds = signal<string[]>([]);
  protected readonly loadError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const [loadedChallenges, progress] = await Promise.all([
        this.challengeLoader.loadAllChallenges(),
        this.progressStore.loadProgress(),
      ]);
      this.challenges.set(loadedChallenges);
      this.completedChallengeIds.set(progress.completedChallenges);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load challenges.';
      this.loadError.set(message);
      this.errorService.addError({
        id: `challenges-load-${Date.now()}`,
        category: 'challenge',
        message,
        recoverable: true,
        timestamp: new Date(),
      });
    }
  }

  protected onChallengeSelected(challengeId: string): void {
    this.router.navigate(['/challenges', challengeId]);
  }
}
