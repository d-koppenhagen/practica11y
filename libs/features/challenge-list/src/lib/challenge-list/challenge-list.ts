import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Challenge } from '@practica11y/models';

export type GroupBy = 'difficulty' | 'tag';

export interface ChallengeGroup {
  key: string;
  label: string;
  challenges: Challenge[];
}

/** Number of days after which "New" and "Updated" badges expire */
const BADGE_EXPIRY_DAYS = 7;

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
  protected readonly groupBy = signal<GroupBy>('difficulty');

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

  protected readonly groupedChallenges = computed<ChallengeGroup[]>(() => {
    const filtered = this.filteredChallenges();
    const mode = this.groupBy();

    if (mode === 'difficulty') {
      return this.groupByDifficulty(filtered);
    }
    return this.groupByTag(filtered);
  });

  protected isCompleted(challengeId: string): boolean {
    return this.completedChallengeIds().includes(challengeId);
  }

  protected isNew(challenge: Challenge): boolean {
    return this.isWithinDays(challenge.createdAt, BADGE_EXPIRY_DAYS);
  }

  protected isUpdated(challenge: Challenge): boolean {
    if (!challenge.updatedAt) return false;
    return this.isWithinDays(challenge.updatedAt, BADGE_EXPIRY_DAYS);
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

  protected setGroupBy(value: GroupBy): void {
    this.groupBy.set(value);
  }

  private groupByDifficulty(challenges: Challenge[]): ChallengeGroup[] {
    const order: { key: Challenge['difficulty']; label: string }[] = [
      { key: 'beginner', label: 'Beginner' },
      { key: 'intermediate', label: 'Intermediate' },
      { key: 'advanced', label: 'Advanced' },
    ];

    return order
      .map((entry) => ({
        key: entry.key,
        label: entry.label,
        challenges: challenges.filter((c) => c.difficulty === entry.key),
      }))
      .filter((group) => group.challenges.length > 0);
  }

  private groupByTag(challenges: Challenge[]): ChallengeGroup[] {
    const tagMap = new Map<string, Challenge[]>();

    for (const challenge of challenges) {
      for (const tag of challenge.tags) {
        const list = tagMap.get(tag) ?? [];
        list.push(challenge);
        tagMap.set(tag, list);
      }
    }

    return Array.from(tagMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, items]) => ({
        key: tag,
        label: tag,
        challenges: items,
      }));
  }

  private isWithinDays(dateStr: string, days: number): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }
}
