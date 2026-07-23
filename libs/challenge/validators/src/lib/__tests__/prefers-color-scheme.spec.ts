import { describe, it, expect, afterEach } from 'vitest';
import { prefersColorScheme } from '../prefers-color-scheme';

/**
 * Helper: injects a <style> element with the given CSS into the global document
 * so that `document.styleSheets` is populated for the validator.
 * Returns a cleanup function to remove the style element.
 */
function injectStyle(css: string): () => void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}

describe('prefers-color-scheme', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it('should have id "prefers-color-scheme"', async () => {
    expect(prefersColorScheme.id).toBe('prefers-color-scheme');
  });

  describe('valid dark mode support → pass', () => {
    it('should pass when CSS contains @media (prefers-color-scheme: dark) with background and color rules', async () => {
      cleanup = injectStyle(`
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a2e;
            color: #e0e0e0;
          }
        }
      `);

      const result = await prefersColorScheme.validate(document);

      expect(result.passed).toBe(true);
      expect(result.validatorId).toBe('prefers-color-scheme');
    });

    it('should pass when using background shorthand instead of background-color', async () => {
      cleanup = injectStyle(`
        @media (prefers-color-scheme: dark) {
          body {
            background: #222;
            color: #fff;
          }
        }
      `);

      const result = await prefersColorScheme.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('missing media query → fail', () => {
    it('should fail when no prefers-color-scheme media query exists', async () => {
      cleanup = injectStyle(`
        body {
          background-color: #fff;
          color: #000;
        }
      `);

      const result = await prefersColorScheme.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain(
        'No @media (prefers-color-scheme: dark)',
      );
    });
  });

  describe('incomplete media query → fail', () => {
    it('should fail when media query exists but lacks color rule', async () => {
      cleanup = injectStyle(`
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a2e;
          }
        }
      `);

      const result = await prefersColorScheme.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('does not adjust the text color');
    });

    it('should fail when media query exists but lacks background rule', async () => {
      cleanup = injectStyle(`
        @media (prefers-color-scheme: dark) {
          body {
            color: #e0e0e0;
          }
        }
      `);

      const result = await prefersColorScheme.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('does not adjust background-color');
    });
  });
});
