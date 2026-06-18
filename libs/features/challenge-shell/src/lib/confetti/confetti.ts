import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
} from '@angular/core';

/**
 * Pure CSS confetti animation component.
 * Shows a burst of colorful confetti pieces from the center of the screen
 * when `trigger` becomes true. Auto-hides after the animation completes (~3s).
 */
@Component({
  selector: 'a11y-confetti',
  template: `
    @if (visible()) {
      <div class="confetti-container" aria-hidden="true">
        @for (piece of pieces; track piece.id) {
          <div
            class="confetti-piece"
            [style.--x]="piece.x"
            [style.--drift]="piece.drift"
            [style.--sway]="piece.sway"
            [style.--burst-x]="piece.burstX"
            [style.--burst-y]="piece.burstY"
            [style.--delay]="piece.delay"
            [style.--color]="piece.color"
            [style.--rotation]="piece.rotation"
            [style.--scale]="piece.scale"
          ></div>
        }
      </div>
    }
  `,
  styleUrl: './confetti.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confetti {
  readonly trigger = input(false);

  protected readonly visible = signal(false);

  protected readonly pieces = this.generatePieces(80);

  constructor() {
    effect(() => {
      if (this.trigger()) {
        this.visible.set(true);
        setTimeout(() => this.visible.set(false), 6000);
      }
    });
  }

  private generatePieces(count: number) {
    const colors = [
      'var(--p11y-primary)',
      'var(--p11y-success)',
      'var(--p11y-warning)',
      'var(--p11y-error)',
      'oklch(0.7 0.15 300)',
      'oklch(0.75 0.18 180)',
      'oklch(0.8 0.12 60)',
    ];

    return Array.from({ length: count }, (_, i) => {
      // Spread horizontally, burst upward (negative Y = up)
      const spreadX = (Math.random() - 0.5) * 500;
      const burstUp = -(100 + Math.random() * 250);

      return {
        id: i,
        // Start clustered around center
        x: `${45 + Math.random() * 10}%`,
        // Burst: wide horizontal spread, upward
        burstX: `${spreadX}px`,
        burstY: `${burstUp}px`,
        // Lateral drift during gravity fall
        drift: `${(Math.random() - 0.5) * 80}px`,
        // Sway amplitude for wobble
        sway: `${5 + Math.random() * 15}px`,
        delay: `${Math.random() * 0.3}s`,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: `${Math.random() * 720}deg`,
        scale: `${0.6 + Math.random() * 0.8}`,
      };
    });
  }
}
