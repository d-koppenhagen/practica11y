import { TestBed } from '@angular/core/testing';

import { PreferenceSimulationStore } from './preference-simulation-store';

describe('PreferenceSimulationStore', () => {
  let store: PreferenceSimulationStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PreferenceSimulationStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('default values', () => {
    it('should default reducedMotion to "no-preference"', () => {
      expect(store.reducedMotion()).toBe('no-preference');
    });

    it('should default colorScheme to "light"', () => {
      expect(store.colorScheme()).toBe('light');
    });

    it('should default contrast to "no-preference"', () => {
      expect(store.contrast()).toBe('no-preference');
    });
  });

  describe('setter methods', () => {
    it('should update reducedMotion via setReducedMotion', () => {
      store.setReducedMotion('reduce');
      expect(store.reducedMotion()).toBe('reduce');
    });

    it('should update colorScheme via setColorScheme', () => {
      store.setColorScheme('dark');
      expect(store.colorScheme()).toBe('dark');
    });

    it('should update contrast via setContrast', () => {
      store.setContrast('more');
      expect(store.contrast()).toBe('more');
    });

    it('should update contrast to "less"', () => {
      store.setContrast('less');
      expect(store.contrast()).toBe('less');
    });

    it('should update contrast to "custom"', () => {
      store.setContrast('custom');
      expect(store.contrast()).toBe('custom');
    });
  });

  describe('hasOverrides computed', () => {
    it('should be false when all values are defaults', () => {
      expect(store.hasOverrides()).toBe(false);
    });

    it('should be true when reducedMotion is non-default', () => {
      store.setReducedMotion('reduce');
      expect(store.hasOverrides()).toBe(true);
    });

    it('should be true when colorScheme is non-default', () => {
      store.setColorScheme('dark');
      expect(store.hasOverrides()).toBe(true);
    });

    it('should be true when contrast is non-default', () => {
      store.setContrast('more');
      expect(store.hasOverrides()).toBe(true);
    });

    it('should be true when multiple preferences are non-default', () => {
      store.setReducedMotion('reduce');
      store.setColorScheme('dark');
      expect(store.hasOverrides()).toBe(true);
    });
  });

  describe('simulationCss computed', () => {
    it('should return empty string for default preferences', () => {
      expect(store.simulationCss()).toBe('');
    });

    it('should update reactively when reducedMotion changes', () => {
      store.setReducedMotion('reduce');
      expect(store.simulationCss()).toContain(
        'animation-duration: 0.01ms !important',
      );
    });

    it('should update reactively when colorScheme changes', () => {
      store.setColorScheme('dark');
      expect(store.simulationCss()).toContain('color-scheme: dark');
    });

    it('should update reactively when contrast changes', () => {
      store.setContrast('more');
      // contrast preferences no longer produce simulation CSS
      // (handled by extractSimulatedMediaRules instead)
      expect(store.simulationCss()).toBe('');
    });
  });

  describe('reset', () => {
    it('should restore all values to defaults', () => {
      store.setReducedMotion('reduce');
      store.setColorScheme('dark');
      store.setContrast('more');

      store.reset();

      expect(store.reducedMotion()).toBe('no-preference');
      expect(store.colorScheme()).toBe('light');
      expect(store.contrast()).toBe('no-preference');
    });

    it('should set hasOverrides to false after reset', () => {
      store.setReducedMotion('reduce');
      store.reset();
      expect(store.hasOverrides()).toBe(false);
    });

    it('should set simulationCss to empty string after reset', () => {
      store.setColorScheme('dark');
      store.reset();
      expect(store.simulationCss()).toBe('');
    });
  });
});
