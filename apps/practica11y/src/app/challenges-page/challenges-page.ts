import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeLoader } from '@practica11y/loader';
import { ChallengeList } from '@practica11y/challenge-list';
import { ErrorService, ProgressStore, Seo } from '@practica11y/util';
import { Challenge } from '@practica11y/models';
import { RandomChallengeDice } from './random-challenge-dice/random-challenge-dice';

@Component({
  selector: 'app-challenges-page',
  imports: [ChallengeList, RandomChallengeDice],
  templateUrl: './challenges-page.html',
  styleUrl: './challenges-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly challengeLoader = inject(ChallengeLoader);
  private readonly progressStore = inject(ProgressStore);
  private readonly errorService = inject(ErrorService);
  private readonly seo = inject(Seo);

  protected readonly challenges = signal<Challenge[]>([]);
  protected readonly completedChallengeIds = signal<string[]>([]);
  protected readonly loadError = signal<string | null>(null);

  protected readonly diceRolling = signal(false);
  protected readonly randomChallenge = signal<Challenge | null>(null);

  /** Only enabled (non-disabled) challenges can be randomly selected */
  protected readonly availableChallenges = computed(() =>
    this.challenges().filter((c) => !c.disabled),
  );

  async ngOnInit(): Promise<void> {
    this.seo.update({
      title: 'Accessibility Challenges',
      description:
        'Browse interactive web accessibility challenges. Solve them directly in your browser and learn the practical implementation of WCAG 2.2.',
      path: '/challenges',
    });

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

  protected rollRandomChallenge(): void {
    const available = this.availableChallenges();
    if (available.length === 0) return;

    const randomIndex = Math.floor(Math.random() * available.length);
    this.randomChallenge.set(available[randomIndex]);
    this.diceRolling.set(true);
  }

  protected onDiceNavigate(challengeId: string): void {
    this.diceRolling.set(false);
    this.randomChallenge.set(null);
    this.router.navigate(['/challenges', challengeId]);
  }

  protected onDiceDismissed(): void {
    this.diceRolling.set(false);
    this.randomChallenge.set(null);
  }
}
