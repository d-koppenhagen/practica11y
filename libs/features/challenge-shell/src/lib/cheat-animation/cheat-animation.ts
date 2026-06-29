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

/**
 * Spy/detective themed animation shown when revealing a solution.
 * Displays animated "sneaky eyes" peering over a "TOP SECRET" stamp.
 * Respects prefers-reduced-motion by showing a static indicator instead.
 * Decorative visuals are hidden from assistive technology; a live region
 * announces the reveal state.
 */
@Component({
  selector: 'a11y-cheat-animation',
  templateUrl: './cheat-animation.html',
  styleUrl: './cheat-animation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheatAnimation {
  private readonly destroyRef = inject(DestroyRef);
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Set to true to start the animation */
  readonly trigger = input(false);

  /** Emits when the animation finishes (or reduced-motion static display completes) */
  readonly animationComplete = output<void>();

  protected readonly visible = signal(false);
  protected readonly reducedMotion = signal(false);

  constructor() {
    this.reducedMotion.set(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    effect(() => {
      if (this.trigger()) {
        this.visible.set(true);
        const duration = this.reducedMotion() ? 750 : 2000;

        if (this.animationTimeout) {
          clearTimeout(this.animationTimeout);
        }

        this.animationTimeout = setTimeout(() => {
          this.visible.set(false);
          this.animationComplete.emit();
          this.animationTimeout = null;
        }, duration);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
    });
  }
}
