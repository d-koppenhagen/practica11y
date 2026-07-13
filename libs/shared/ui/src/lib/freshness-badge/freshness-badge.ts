import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Number of days after which "New" and "Updated" badges expire */
const BADGE_EXPIRY_DAYS = 14;

export type FreshnessType = 'new' | 'updated' | 'none';

@Component({
  selector: 'a11y-freshness-badge',
  template: `
    @switch (badgeType()) {
      @case ('new') {
        <span class="freshness-badge freshness-badge--new" aria-hidden="true"
          >New</span
        >
      }
      @case ('updated') {
        <span
          class="freshness-badge freshness-badge--updated"
          aria-hidden="true"
          >Updated</span
        >
      }
    }
  `,
  styles: `
    .freshness-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      white-space: nowrap;
      line-height: 1.4;
    }

    .freshness-badge--new {
      background-color: var(--p11y-primary-bg, #dbeafe);
      color: var(--p11y-primary, #2563eb);
    }

    .freshness-badge--updated {
      background-color: var(--p11y-info-bg, #e0e7ff);
      color: var(--p11y-info-text, #4f46e5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreshnessBadge {
  readonly createdAt = input.required<string>();
  readonly updatedAt = input<string | undefined>();

  protected readonly badgeType = computed<FreshnessType>(() => {
    if (this.isWithinDays(this.createdAt(), BADGE_EXPIRY_DAYS)) {
      return 'new';
    }
    const updated = this.updatedAt();
    if (updated && this.isWithinDays(updated, BADGE_EXPIRY_DAYS)) {
      return 'updated';
    }
    return 'none';
  });

  private isWithinDays(dateStr: string, days: number): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }
}
