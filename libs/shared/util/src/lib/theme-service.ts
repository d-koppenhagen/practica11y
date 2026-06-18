import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSettings } from '@practica11y/types';

export type Theme = 'light' | 'dark';

/**
 * ThemeService manages the application's color theme.
 * It sets data-theme="light"|"dark" on the <html> element based on
 * UserSettings.editorTheme. If no explicit setting is stored,
 * it defaults to the user's system preference (prefers-color-scheme).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Current active theme */
  readonly theme = signal<Theme>(this.getInitialTheme());

  /** Callback for persisting theme changes — set by the app on init */
  private persistFn: ((theme: Theme) => void) | null = null;

  constructor() {
    // Apply theme attribute to <html> whenever the signal changes
    effect(() => {
      this.applyTheme(this.theme());
    });
  }

  /** Register a persistence callback (called from app init) */
  registerPersistence(fn: (theme: Theme) => void): void {
    this.persistFn = fn;
  }

  /** Update theme from UserSettings */
  applySettings(settings: UserSettings): void {
    this.theme.set(settings.editorTheme);
  }

  /** Toggle between light and dark */
  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
    this.persistFn?.(this.theme());
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }

    // Check system preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
  }
}
