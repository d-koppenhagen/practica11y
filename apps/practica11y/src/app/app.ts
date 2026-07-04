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
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  AuthStore,
  ErrorService,
  Gamification,
  ProgressStore,
  SyncStore,
  ThemeService,
} from '@practica11y/util';
import { ChallengeLoader } from '@practica11y/loader';
import {
  DeviceFlowDialog,
  DeviceFlowDialogData,
  ThemeToggle,
  UserMenu,
} from '@practica11y/ui';
import { LEVEL_THRESHOLDS } from '@practica11y/types';

@Component({
  imports: [RouterModule, ThemeToggle, UserMenu, A11yModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full-width]': 'isFullWidth()',
  },
})
export class App {
  private readonly progressStore = inject(ProgressStore);
  private readonly gamification = inject(Gamification);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly errorService = inject(ErrorService);
  private readonly challengeLoader = inject(ChallengeLoader);
  protected readonly authStore = inject(AuthStore);
  private readonly syncStore = inject(SyncStore);
  private readonly dialog = inject(Dialog);

  private deviceFlowDialogRef: DialogRef<'cancel' | undefined> | null = null;

  protected readonly mainContent =
    viewChild<ElementRef<HTMLElement>>('mainContent');
  protected readonly menuToggleBtn =
    viewChild<ElementRef<HTMLButtonElement>>('menuToggleBtn');
  protected readonly isFullWidth = signal(false);
  protected readonly currentChallengeId = signal<string | null>(null);
  protected readonly isPlayground = signal(false);
  protected readonly menuOpen = signal(false);

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

  protected readonly firstChallengeId = computed<string | null>(() => {
    const challenges = this.challengeLoader.availableChallenges();
    if (challenges.length === 0) return null;
    return challenges[0].id;
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
    this.initializeAuth();
    this.setupFocusManagement();
    this.loadChallengeList();
    this.setupXPAnimation();
    this.setupDeviceFlowDialog();
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
        this.isPlayground.set(url === '/challenges/playground');
        this.menuOpen.set(false);

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

  protected toggleMenu(): void {
    const willOpen = !this.menuOpen();
    this.menuOpen.set(willOpen);
    if (!willOpen) {
      this.menuToggleBtn()?.nativeElement.focus();
    }
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.menuToggleBtn()?.nativeElement.focus();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.menuOpen()) {
      event.preventDefault();
      this.closeMenu();
    }
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

  private initializeAuth(): void {
    this.authStore.initialize();

    // Sync whenever auth state transitions to 'authenticated'.
    // Covers both: fresh Device Flow auth (Req 4.1) and
    // app load with a valid stored token (Req 4.2).
    effect(() => {
      if (this.authStore.state() === 'authenticated') {
        untracked(() => this.syncStore.sync());
      }
    });
  }

  private setupDeviceFlowDialog(): void {
    effect(() => {
      const code = this.authStore.deviceCode();

      if (code && !this.deviceFlowDialogRef) {
        // Open the dialog
        const data: DeviceFlowDialogData = {
          userCode: code.userCode,
          verificationUri: code.verificationUri,
          isPolling: true,
          errorMessage: null,
        };

        this.deviceFlowDialogRef = this.dialog.open<
          'cancel' | undefined,
          DeviceFlowDialogData
        >(DeviceFlowDialog, {
          data,
          ariaModal: true,
          ariaLabelledBy: 'device-flow-dialog-title',
          autoFocus: 'dialog',
          restoreFocus: true,
          panelClass: 'device-flow-dialog-panel',
        });

        this.deviceFlowDialogRef.closed.subscribe((result) => {
          this.deviceFlowDialogRef = null;
          if (result === 'cancel') {
            untracked(() => this.authStore.cancelDeviceFlow());
          }
        });
      } else if (!code && this.deviceFlowDialogRef) {
        // Close the dialog (auth completed or cancelled elsewhere)
        this.deviceFlowDialogRef.close();
        this.deviceFlowDialogRef = null;
      }
    });
  }
}
