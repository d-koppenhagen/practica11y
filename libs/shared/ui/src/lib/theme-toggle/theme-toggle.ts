import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '@practica11y/util';

@Component({
  selector: 'lib-theme-toggle',
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="themeService.toggle()"
      [attr.aria-label]="
        themeService.theme() === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      "
      [attr.aria-pressed]="themeService.theme() === 'dark'"
    >
      @if (themeService.theme() === 'dark') {
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      } @else {
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      }
    </button>
  `,
  styles: `
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 1px solid var(--p11y-border);
      border-radius: var(--p11y-radius-sm);
      background-color: var(--p11y-bg-surface);
      color: var(--p11y-text-secondary);
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;
    }

    .theme-toggle:hover {
      background-color: var(--p11y-bg-muted);
      color: var(--p11y-text);
      border-color: var(--p11y-border-strong);
    }

    .theme-toggle:focus-visible {
      outline: 2px solid var(--p11y-primary);
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
}
