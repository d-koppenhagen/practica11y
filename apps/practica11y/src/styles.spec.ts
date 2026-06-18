import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads styles.css and parses oklch color values for design system validation.
 */
describe('Design System Color Palette', () => {
  const cssContent = readFileSync(resolve(__dirname, './styles.css'), 'utf-8');

  /**
   * Extracts oklch hue values for CSS custom properties matching a given pattern.
   * Returns an array of { name, hue, chroma } objects.
   */
  function extractOklchValues(variablePattern: RegExp) {
    const results: { name: string; hue: number; chroma: number }[] = [];
    const lines = cssContent.split('\n');

    for (const line of lines) {
      const varMatch = line.match(
        /(--[\w-]+)\s*:\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/,
      );
      if (varMatch) {
        const [, name, , chroma, hue] = varMatch;
        if (variablePattern.test(name)) {
          results.push({
            name,
            hue: parseFloat(hue),
            chroma: parseFloat(chroma),
          });
        }
      }
    }

    return results;
  }

  describe('Primary color palette hue (--color-primary-*)', () => {
    const primaryColors = extractOklchValues(/^--color-primary-\d+$/);

    it('should have all primary color steps defined (50-900)', () => {
      const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
      for (const step of steps) {
        const found = primaryColors.find(
          (c) => c.name === `--color-primary-${step}`,
        );
        expect(
          found,
          `--color-primary-${step} should be defined`,
        ).toBeDefined();
      }
    });

    it('should have oklch hue in range [175, 185] for all primary colors', () => {
      expect(primaryColors.length).toBeGreaterThan(0);

      for (const color of primaryColors) {
        expect(
          color.hue,
          `${color.name} hue should be in [175, 185], got ${color.hue}`,
        ).toBeGreaterThanOrEqual(175);
        expect(
          color.hue,
          `${color.name} hue should be in [175, 185], got ${color.hue}`,
        ).toBeLessThanOrEqual(185);
      }
    });
  });

  describe('Surface color palette hue (--color-surface-{200..900})', () => {
    const surfaceColors = extractOklchValues(/^--color-surface-\d+$/);

    // Filter to steps 200-900 with non-zero chroma
    const tintedSurfaces = surfaceColors.filter((c) => {
      const step = parseInt(c.name.replace('--color-surface-', ''), 10);
      return step >= 200 && step <= 900 && c.chroma > 0;
    });

    it('should have tinted surface colors (200-900) with non-zero chroma', () => {
      expect(tintedSurfaces.length).toBeGreaterThan(0);
    });

    it('should have oklch hue in range [175, 185] for tinted surface colors', () => {
      for (const color of tintedSurfaces) {
        expect(
          color.hue,
          `${color.name} hue should be in [175, 185], got ${color.hue}`,
        ).toBeGreaterThanOrEqual(175);
        expect(
          color.hue,
          `${color.name} hue should be in [175, 185], got ${color.hue}`,
        ).toBeLessThanOrEqual(185);
      }
    });
  });
});
