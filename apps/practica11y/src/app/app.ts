import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  effect,
  untracked,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  ErrorService,
  Gamification,
  ProgressStore,
  ThemeService,
} from '@practica11y/util';
import { ChallengeLoader } from '@practica11y/loader';
import { ThemeToggle } from '@practica11y/ui';
import { LEVEL_THRESHOLDS } from '@practica11y/types';

@Component({
  imports: [RouterModule, ThemeToggle],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly progressStore = inject(ProgressStore);
  private readonly gamification = inject(Gamification);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly errorService = inject(ErrorService);
  private readonly challengeLoader = inject(ChallengeLoader);

  protected readonly mainContent =
    viewChild<ElementRef<HTMLElement>>('mainContent');
  protected readonly isFullWidth = signal(false);
  protected readonly currentChallengeId = signal<string | null>(null);

  protected readonly currentLevel = this.gamification.currentLevel;
  protected readonly currentXP = this.gamification.currentXP;
  protected readonly animatedXP = signal(0);
  protected readonly xpBumped = signal(false);
  protected readonly errors = this.errorService.errors;

  protected readonly levelDisplay = computed(() => {
    const level = this.currentLevel();
    const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
    return threshold ? `${threshold.emoji} ${threshold.label}` : '🌱 Hatchling';
  });

  protected readonly previousChallenge = computed<{
    id: string;
    title: string;
  } | null>(() => {
    const currentId = this.currentChallengeId();
    const challenges = this.challengeLoader.availableChallenges();
    if (!currentId || challenges.length === 0) return null;
    const idx = challenges.findIndex((c) => c.id === currentId);
    if (idx <= 0) return null;
    const prev = challenges[idx - 1];
    return { id: prev.id, title: prev.title };
  });

  protected readonly nextChallenge = computed<{
    id: string;
    title: string;
  } | null>(() => {
    const currentId = this.currentChallengeId();
    const challenges = this.challengeLoader.availableChallenges();
    if (!currentId || challenges.length === 0) return null;
    const idx = challenges.findIndex((c) => c.id === currentId);
    if (idx < 0 || idx >= challenges.length - 1) return null;
    const next = challenges[idx + 1];
    return { id: next.id, title: next.title };
  });

  constructor() {
    this.initializeProgress();
    this.setupFocusManagement();
    this.loadChallengeList();
    this.setupXPAnimation();
  }

  private setupXPAnimation(): void {
    let animationId: number | null = null;

    effect(() => {
      const target = this.currentXP();
      // Read animatedXP without tracking to avoid re-triggering the effect
      const start = untracked(() => this.animatedXP());

      if (start === target) return;

      // Cancel any running animation
      if (animationId != null) {
        cancelAnimationFrame(animationId);
      }

      const diff = target - start;
      const duration = Math.min(800, Math.max(300, Math.abs(diff) * 20));
      const startTime = performance.now();

      // Trigger bump animation
      this.xpBumped.set(true);
      setTimeout(() => this.xpBumped.set(false), 400);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + diff * eased);
        this.animatedXP.set(current);

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          animationId = null;
        }
      };

      animationId = requestAnimationFrame(animate);
    });
  }

  private setupFocusManagement(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.isFullWidth.set(url.startsWith('/challenges/'));

        // Extract challenge ID from URL
        const match = url.match(/^\/challenges\/([^/?#]+)/);
        this.currentChallengeId.set(match ? match[1] : null);

        const mainEl = this.mainContent()?.nativeElement;
        if (mainEl) {
          mainEl.focus({ preventScroll: true });
        }
      });
  }

  protected dismissError(id: string): void {
    this.errorService.clearError(id);
  }

  private async initializeProgress(): Promise<void> {
    try {
      await this.progressStore.initialize();
      const [progress, settings] = await Promise.all([
        this.progressStore.loadProgress(),
        this.progressStore.loadSettings(),
      ]);
      this.gamification.currentXP.set(progress.xp);
      // Set animatedXP directly to avoid count-up on page load
      this.animatedXP.set(progress.xp);
      this.themeService.applySettings(settings);
      this.themeService.registerPersistence((theme) => {
        this.progressStore.saveSettings({ ...settings, editorTheme: theme });
      });
    } catch (e) {
      this.errorService.addError({
        id: `progress-init-${Date.now()}`,
        category: 'storage',
        message: e instanceof Error ? e.message : 'Failed to load progress.',
        recoverable: true,
        timestamp: new Date(),
      });
    }
  }

  private loadChallengeList(): void {
    this.challengeLoader.loadAllChallenges().catch(() => {
      // Silently ignore — navigation will just show disabled prev/next
    });
  }
}
