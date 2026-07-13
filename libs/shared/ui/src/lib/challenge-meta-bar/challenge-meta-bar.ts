import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DifficultyBadge } from '../difficulty-badge/difficulty-badge';
import { PointsBadge } from '../points-badge/points-badge';
import { FreshnessBadge } from '../freshness-badge/freshness-badge';

@Component({
  selector: 'a11y-challenge-meta-bar',
  imports: [DatePipe, DifficultyBadge, PointsBadge, FreshnessBadge],
  template: `
    <div class="meta-bar">
      <a11y-difficulty-badge [difficulty]="difficulty()" />
      <a11y-points-badge [points]="points()" />
      <a11y-freshness-badge
        [createdAt]="createdAt()"
        [updatedAt]="updatedAt()"
      />
      <span class="meta-date">
        <svg
          aria-hidden="true"
          class="meta-date-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        @if (updatedAt()) {
          <span
            >Updated:
            <time [attr.datetime]="updatedAt()">{{
              updatedAt() | date: 'mediumDate'
            }}</time></span
          >
        } @else {
          <span
            >Created:
            <time [attr.datetime]="createdAt()">{{
              createdAt() | date: 'mediumDate'
            }}</time></span
          >
        }
      </span>
    </div>
  `,
  styles: `
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--p11y-border, #e5e7eb);
      margin-bottom: 0.75rem;
    }

    .meta-date {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--p11y-text-muted, #6b7280);
      white-space: nowrap;
    }

    .meta-date-icon {
      flex-shrink: 0;
      opacity: 0.7;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeMetaBar {
  readonly difficulty = input.required<
    'beginner' | 'intermediate' | 'advanced'
  >();
  readonly points = input.required<number>();
  readonly createdAt = input.required<string>();
  readonly updatedAt = input<string | undefined>();
}
