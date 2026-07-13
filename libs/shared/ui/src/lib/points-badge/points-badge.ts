import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'a11y-points-badge',
  template: `
    <span class="points-badge">
      <svg
        aria-hidden="true"
        class="points-icon"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
      {{ points() }} Points
    </span>
  `,
  styles: `
    .points-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--p11y-text-muted, #6b7280);
      white-space: nowrap;
    }

    .points-icon {
      flex-shrink: 0;
      opacity: 0.7;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointsBadge {
  readonly points = input.required<number>();
}
