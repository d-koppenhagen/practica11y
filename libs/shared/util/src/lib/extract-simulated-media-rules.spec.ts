import { describe, it, expect } from 'vitest';

import type { SimulationPreferences } from './build-simulation-css';
import { extractSimulatedMediaRules } from './extract-simulated-media-rules';

describe('extractSimulatedMediaRules', () => {
  const defaultPrefs: SimulationPreferences = {
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    contrast: 'no-preference',
  };

  it('should return empty string when no matching media queries exist', () => {
    const css = `.card { background: white; }`;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      colorScheme: 'dark',
    });
    expect(result).toBe('');
  });

  it('should extract rules from @media (prefers-color-scheme: dark) when colorScheme is dark', () => {
    const css = `
      .card { background: white; }
      @media (prefers-color-scheme: dark) {
        .card { background-color: #1f2937; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      colorScheme: 'dark',
    });
    expect(result).toContain('.card { background-color: #1f2937; }');
  });

  it('should NOT extract dark rules when colorScheme is light', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        .card { background-color: #1f2937; }
      }
    `;
    const result = extractSimulatedMediaRules(css, defaultPrefs);
    expect(result).toBe('');
  });

  it('should extract rules from @media (prefers-reduced-motion: reduce) when reducedMotion is reduce', () => {
    const css = `
      @media (prefers-reduced-motion: reduce) {
        .animated { animation: none; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      reducedMotion: 'reduce',
    });
    expect(result).toContain('.animated { animation: none; }');
  });

  it('should extract rules from @media (prefers-contrast: more) when contrast is more', () => {
    const css = `
      @media (prefers-contrast: more) {
        .text { color: #000; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      contrast: 'more',
    });
    expect(result).toContain('.text { color: #000; }');
  });

  it('should extract rules from @media (prefers-contrast: less) when contrast is less', () => {
    const css = `
      @media (prefers-contrast: less) {
        .border { border-color: #ccc; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      contrast: 'less',
    });
    expect(result).toContain('.border { border-color: #ccc; }');
  });

  it('should handle multiple matching media query blocks', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        .card { background: #333; }
      }
      .other { margin: 0; }
      @media (prefers-color-scheme: dark) {
        h1 { color: white; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      colorScheme: 'dark',
    });
    expect(result).toContain('.card { background: #333; }');
    expect(result).toContain('h1 { color: white; }');
  });

  it('should handle nested braces (rules with declarations inside selectors)', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        .card {
          background-color: #1f2937;
          border-color: #4b5563;
        }
        h1 {
          color: #f9fafb;
        }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      colorScheme: 'dark',
    });
    expect(result).toContain('background-color: #1f2937;');
    expect(result).toContain('border-color: #4b5563;');
    expect(result).toContain('color: #f9fafb;');
  });

  it('should not break on empty media query blocks', () => {
    const css = `
      @media (prefers-color-scheme: dark) {}
    `;
    const result = extractSimulatedMediaRules(css, {
      ...defaultPrefs,
      colorScheme: 'dark',
    });
    expect(result).toBe('');
  });

  it('should combine extractions from multiple preference types', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        .card { background: #333; }
      }
      @media (prefers-reduced-motion: reduce) {
        .box { animation: none; }
      }
    `;
    const result = extractSimulatedMediaRules(css, {
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      contrast: 'no-preference',
    });
    expect(result).toContain('.card { background: #333; }');
    expect(result).toContain('.box { animation: none; }');
  });
});
