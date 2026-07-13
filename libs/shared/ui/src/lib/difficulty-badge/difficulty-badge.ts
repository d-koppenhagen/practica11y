import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'a11y-difficulty-badge',
  template: `
    <span
      class="difficulty-badge"
      [class.difficulty-beginner]="difficulty() === 'beginner'"
      [class.difficulty-intermediate]="difficulty() === 'intermediate'"
      [class.difficulty-advanced]="difficulty() === 'advanced'"
    >
      {{ difficulty() }}
    </span>
  `,
  styles: `
    .difficulty-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .difficulty-beginner {
      background-color: var(--p11y-success-bg);
      color: var(--p11y-success-text);
    }

    .difficulty-intermediate {
      background-color: var(--p11y-warning-bg);
      color: var(--p11y-warning-text);
    }

    .difficulty-advanced {
      background-color: var(--p11y-error-bg);
      color: var(--p11y-error-text);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultyBadge {
  readonly difficulty = input.required<
    'beginner' | 'intermediate' | 'advanced'
  >();
}
