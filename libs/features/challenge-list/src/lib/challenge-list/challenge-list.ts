import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Challenge } from '@practica11y/models';

@Component({
  selector: 'a11y-challenge-list',
  imports: [],
  templateUrl: './challenge-list.html',
  styleUrl: './challenge-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeList {
  readonly challenges = input<Challenge[]>([]);
  readonly completedChallengeIds = input<string[]>([]);
  readonly challengeSelected = output<string>();

  protected readonly difficultyFilter = signal<
    'all' | 'beginner' | 'intermediate' | 'advanced'
  >('all');
  protected readonly tagFilter = signal<string>('all');

  protected readonly availableTags = computed<string[]>(() => {
    const tags = new Set<string>();
    for (const challenge of this.challenges()) {
      for (const tag of challenge.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  });

  protected readonly filteredChallenges = computed<Challenge[]>(() => {
    let result = this.challenges();

    const difficulty = this.difficultyFilter();
    if (difficulty !== 'all') {
      result = result.filter((c) => c.difficulty === difficulty);
    }

    const tag = this.tagFilter();
    if (tag !== 'all') {
      result = result.filter((c) => c.tags.includes(tag));
    }

    return result;
  });

  protected isCompleted(challengeId: string): boolean {
    return this.completedChallengeIds().includes(challengeId);
  }

  protected selectChallenge(challenge: Challenge): void {
    if (challenge.disabled) return;
    this.challengeSelected.emit(challenge.id);
  }

  protected setDifficultyFilter(
    value: 'all' | 'beginner' | 'intermediate' | 'advanced',
  ): void {
    this.difficultyFilter.set(value);
  }

  protected setTagFilter(value: string): void {
    this.tagFilter.set(value);
  }
}
