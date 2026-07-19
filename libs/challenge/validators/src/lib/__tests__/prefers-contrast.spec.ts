import { describe, it, expect, afterEach } from 'vitest';
import { prefersContrast } from '../prefers-contrast';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Helper to create a document with injected CSS for testing.
 * Injects a <style> element so the validator can read from
 * document.styleSheets and/or style element text content.
 */
function injectCss(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Creates a minimal analysis result context with sourceHtml set
 * to trigger the text-based fallback path in the validator.
 */
function createAnalysisContext(): AccessibilityAnalysisResult {
  return {
    sourceHtml: '<html></html>',
    axeResults: [],
    treeNodes: { role: 'document', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
  };
}

describe('prefers-contrast', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should have id "prefers-contrast"', () => {
    expect(prefersContrast.id).toBe('prefers-contrast');
  });

  describe('valid prefers-contrast usage → pass', () => {
    it('should pass when CSS contains @media (prefers-contrast: more) with border rules', () => {
      injectCss(`
        .card { border: 1px solid #ccc; }
        @media (prefers-contrast: more) {
          .card { border: 2px solid #000; }
        }
      `);

      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(true);
      expect(result.validatorId).toBe('prefers-contrast');
    });

    it('should pass when CSS contains @media (prefers-contrast: more) with box-shadow rules', () => {
      injectCss(`
        .card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        @media (prefers-contrast: more) {
          .card { box-shadow: none; }
        }
      `);

      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when CSS contains @media (prefers-contrast: more) with outline rules', () => {
      injectCss(`
        .btn { outline: none; }
        @media (prefers-contrast: more) {
          .btn { outline: 2px solid #000; }
        }
      `);

      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('missing media query → fail', () => {
    it('should fail when no prefers-contrast media query exists', () => {
      injectCss(`
        .card { border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      `);

      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain(
        'Missing or incomplete prefers-contrast support',
      );
      expect(result.details).toContain(
        'No @media (prefers-contrast: more) query found',
      );
    });

    it('should fail when page has no stylesheets at all', () => {
      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(false);
    });
  });

  describe('media query without contrast-enhancing rules → fail', () => {
    it('should fail when prefers-contrast: more exists but lacks border/box-shadow/outline rules', () => {
      injectCss(`
        @media (prefers-contrast: more) {
          .card { color: #000; background-color: #fff; }
        }
      `);

      const result = prefersContrast.validate(
        document,
        createAnalysisContext(),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain(
        'does not appear to adjust borders, box-shadows, or outlines',
      );
    });
  });
});
