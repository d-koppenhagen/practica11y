import { Injectable, signal, computed } from '@angular/core';

import {
  buildSimulationCss,
  type ColorSchemePreference,
  type ContrastPreference,
  type ReducedMotionPreference,
} from './build-simulation-css';

@Injectable({ providedIn: 'root' })
export class PreferenceSimulationStore {
  readonly reducedMotion = signal<ReducedMotionPreference>('no-preference');
  readonly colorScheme = signal<ColorSchemePreference>('light');
  readonly contrast = signal<ContrastPreference>('no-preference');

  readonly hasOverrides = computed(
    () =>
      this.reducedMotion() !== 'no-preference' ||
      this.colorScheme() !== 'light' ||
      this.contrast() !== 'no-preference',
  );

  readonly simulationCss = computed(() =>
    buildSimulationCss({
      reducedMotion: this.reducedMotion(),
      colorScheme: this.colorScheme(),
      contrast: this.contrast(),
    }),
  );

  setReducedMotion(value: ReducedMotionPreference): void {
    this.reducedMotion.set(value);
  }

  setColorScheme(value: ColorSchemePreference): void {
    this.colorScheme.set(value);
  }

  setContrast(value: ContrastPreference): void {
    this.contrast.set(value);
  }

  reset(): void {
    this.reducedMotion.set('no-preference');
    this.colorScheme.set('light');
    this.contrast.set('no-preference');
  }
}
