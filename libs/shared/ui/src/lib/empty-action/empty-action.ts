import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'a11y-empty-action',
  template: `
    <div class="empty-action-icon" aria-hidden="true">
      <ng-content select="[icon]" />
    </div>
    <button
      type="button"
      class="empty-action-btn"
      [class.active]="active()"
      [attr.aria-pressed]="active() ? true : null"
      (click)="actionClick.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      height: 100%;
      min-height: 4rem;
    }

    .empty-action-icon {
      position: absolute;
      width: 14rem;
      height: 14rem;
      color: var(--p11y-primary);
      opacity: 0.08;
      filter: blur(4px);
      pointer-events: none;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-action-icon ::ng-deep svg {
      width: 100%;
      height: 100%;
    }

    .empty-action-btn {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--p11y-primary);
      background-color: transparent;
      border: none;
      border-radius: 0;
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
      margin: 0;
      z-index: 1;
    }

    .empty-action-btn:hover {
      background-color: color-mix(
        in srgb,
        var(--p11y-primary) 10%,
        transparent
      );
      color: var(--p11y-primary);
    }

    .empty-action-btn:focus-visible {
      outline: 2px solid var(--p11y-primary);
      outline-offset: -2px;
    }

    .empty-action-btn:active {
      background-color: color-mix(
        in srgb,
        var(--p11y-primary) 18%,
        transparent
      );
      color: var(--p11y-primary);
    }

    .empty-action-btn.active {
      background-color: color-mix(
        in srgb,
        var(--p11y-primary) 15%,
        transparent
      );
      cursor: crosshair;
    }

    @media (prefers-reduced-motion: reduce) {
      .empty-action-btn {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyAction {
  /** Whether the button is in an active/pressed state (e.g. picker mode). */
  readonly active = input(false);

  /** Emits when the action button is clicked. */
  readonly actionClick = output<void>();
}
