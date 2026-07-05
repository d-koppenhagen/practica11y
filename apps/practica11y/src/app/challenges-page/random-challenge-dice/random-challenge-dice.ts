import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { Challenge } from '@practica11y/models';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Full-screen dice roll animation for selecting a random challenge.
 * Displays a 3D spinning dice that lands on a face showing the chosen challenge name.
 * After landing, a shiny particle burst effect plays before emitting the selected challenge.
 *
 * Accessibility:
 * - All visuals are `aria-hidden="true"` (decorative)
 * - A live region announces the rolling state and result
 * - Respects `prefers-reduced-motion`: skips animation, shows result immediately
 */
@Component({
  selector: 'app-random-challenge-dice',
  imports: [A11yModule],
  templateUrl: './random-challenge-dice.html',
  styleUrl: './random-challenge-dice.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class RandomChallengeDice {
  private readonly destroyRef = inject(DestroyRef);
  private rollTimeout: ReturnType<typeof setTimeout> | null = null;

  /** The challenge that was randomly selected */
  readonly challenge = input.required<Challenge>();

  /** Triggers the dice roll animation */
  readonly trigger = input(false);

  /** Emits when user confirms they want to start the challenge */
  readonly navigateToChallenge = output<string>();

  /** Emits when user dismisses the dice result */
  readonly dismissed = output<void>();

  protected readonly visible = signal(false);
  protected readonly phase = signal<'rolling' | 'landed' | 'hidden'>('hidden');
  protected readonly reducedMotion = signal(false);

  /** Decorative shine rays radiating from center */
  protected readonly shineRays = this.generateShineRays(16);

  /** Decorative sparkle particles */
  protected readonly sparkles = this.generateSparkles(24);

  constructor() {
    this.reducedMotion.set(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    effect(() => {
      if (this.trigger()) {
        this.startRoll();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.rollTimeout) clearTimeout(this.rollTimeout);
    });
  }

  protected startChallenge(): void {
    this.visible.set(false);
    this.phase.set('hidden');
    this.navigateToChallenge.emit(this.challenge().id);
  }

  protected dismiss(): void {
    this.visible.set(false);
    this.phase.set('hidden');
    this.dismissed.emit();
  }

  protected onEscape(): void {
    if (this.phase() === 'landed') {
      this.dismiss();
    }
  }

  private startRoll(): void {
    this.visible.set(true);
    this.phase.set('rolling');

    const rollDuration = this.reducedMotion() ? 300 : 1200;

    this.rollTimeout = setTimeout(() => {
      this.phase.set('landed');
      this.rollTimeout = null;
    }, rollDuration);
  }

  private generateShineRays(count: number) {
    const colors = [
      'oklch(0.9 0.12 80)',
      'oklch(0.85 0.15 60)',
      'oklch(0.9 0.1 180)',
      'oklch(0.88 0.13 300)',
      'oklch(0.92 0.08 40)',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: `${(360 / count) * i}deg`,
      delay: `${Math.random() * 0.3}s`,
      length: `${80 + Math.random() * 120}px`,
      color: colors[i % colors.length],
    }));
  }

  private generateSparkles(count: number) {
    const colors = [
      'oklch(0.95 0.12 80)',
      'oklch(0.9 0.15 60)',
      'oklch(0.92 0.1 180)',
      'oklch(0.88 0.12 300)',
      '#fff',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${20 + Math.random() * 60}%`,
      y: `${20 + Math.random() * 60}%`,
      delay: `${Math.random() * 0.6}s`,
      size: `${4 + Math.random() * 8}px`,
      color: colors[i % colors.length],
    }));
  }
}
