import {
  buildSimulationCss,
  SimulationPreferences,
} from './build-simulation-css';

describe('buildSimulationCss', () => {
  const defaults: SimulationPreferences = {
    reducedMotion: 'no-preference',
    colorScheme: 'light',
    contrast: 'no-preference',
  };

  it('should return empty string for default preferences', () => {
    expect(buildSimulationCss(defaults)).toBe('');
  });

  describe('prefers-reduced-motion', () => {
    it('should produce animation/transition overrides with !important for "reduce"', () => {
      const result = buildSimulationCss({
        ...defaults,
        reducedMotion: 'reduce',
      });

      expect(result).toContain('animation-duration: 0.01ms !important');
      expect(result).toContain('animation-iteration-count: 1 !important');
      expect(result).toContain('transition-duration: 0.01ms !important');
      expect(result).toContain('scroll-behavior: auto !important');
    });
  });

  describe('prefers-color-scheme', () => {
    it('should produce :root { color-scheme: dark; ... } for "dark"', () => {
      const result = buildSimulationCss({
        ...defaults,
        colorScheme: 'dark',
      });

      expect(result).toContain(':root { color-scheme: dark;');
      expect(result).toContain('background-color: #1a1a2e');
      expect(result).toContain('color: #e0e0e0');
    });

    it('should produce no output for "light" when alone', () => {
      const result = buildSimulationCss({
        ...defaults,
        colorScheme: 'light',
      });

      expect(result).toBe('');
    });
  });

  describe('prefers-contrast', () => {
    it('should produce border/box-shadow overrides for "more"', () => {
      const result = buildSimulationCss({
        ...defaults,
        contrast: 'more',
      });

      expect(result).toContain('border-color: #000 !important');
      expect(result).toContain('box-shadow: none !important');
    });

    it('should produce border override for "less"', () => {
      const result = buildSimulationCss({
        ...defaults,
        contrast: 'less',
      });

      expect(result).toContain('border-color: #ccc !important');
    });

    it('should produce forced-colors rule for "custom"', () => {
      const result = buildSimulationCss({
        ...defaults,
        contrast: 'custom',
      });

      expect(result).toContain('forced-colors: none');
    });
  });

  describe('combinations', () => {
    it('should produce all corresponding blocks for multiple non-default preferences', () => {
      const result = buildSimulationCss({
        reducedMotion: 'reduce',
        colorScheme: 'dark',
        contrast: 'more',
      });

      // reduced-motion block
      expect(result).toContain('animation-duration: 0.01ms !important');
      expect(result).toContain('transition-duration: 0.01ms !important');
      // color-scheme block
      expect(result).toContain(':root { color-scheme: dark;');
      // contrast block
      expect(result).toContain('border-color: #000 !important');
      expect(result).toContain('box-shadow: none !important');
    });

    it('should inject explicit light color-scheme when reducedMotion is non-default but colorScheme is light', () => {
      const result = buildSimulationCss({
        reducedMotion: 'reduce',
        colorScheme: 'light',
        contrast: 'no-preference',
      });

      expect(result).toContain('animation-duration: 0.01ms !important');
      expect(result).toContain(':root { color-scheme: light; }');
    });
  });

  describe('selector safety', () => {
    it('should only contain :root, body, or * selectors (no class/ID/attribute selectors)', () => {
      const allCombinations: SimulationPreferences[] = [
        { reducedMotion: 'reduce', colorScheme: 'dark', contrast: 'more' },
        { reducedMotion: 'reduce', colorScheme: 'dark', contrast: 'less' },
        { reducedMotion: 'reduce', colorScheme: 'dark', contrast: 'custom' },
        { reducedMotion: 'reduce', colorScheme: 'light', contrast: 'more' },
        {
          reducedMotion: 'no-preference',
          colorScheme: 'dark',
          contrast: 'more',
        },
      ];

      for (const prefs of allCombinations) {
        const result = buildSimulationCss(prefs);

        // Should not contain class selectors
        expect(result).not.toMatch(/\.[a-zA-Z]/);
        // Should not contain ID selectors
        expect(result).not.toMatch(/#[a-zA-Z](?![\da-fA-F])/);
        // Should not contain attribute selectors
        expect(result).not.toMatch(/\[[a-zA-Z]/);
      }
    });
  });
});
