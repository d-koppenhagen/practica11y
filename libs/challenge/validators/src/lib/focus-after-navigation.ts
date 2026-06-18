import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that SPA-style navigation properly manages focus and current-page indication:
 * 1. The main content area (or heading) has tabindex="-1" to be programmatically focusable
 * 2. The JavaScript calls .focus() after updating content
 * 3. aria-current="page" is set on the active navigation link
 *
 * This ensures screen reader and keyboard users are informed about content changes
 * and which page is currently active.
 */
export const focusAfterNavigation: Validator = {
  id: 'focus-after-navigation',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const errors: string[] = [];

    // Check 1: The main content area or its heading/container must have tabindex="-1"
    const mainEl = document.querySelector('main');
    const contentContainer = document.getElementById('page-content');
    const mainHeading =
      mainEl?.querySelector('h1, h2') ??
      contentContainer?.querySelector('h1, h2');

    const focusableTargets = [mainEl, contentContainer, mainHeading].filter(
      Boolean,
    );
    const hasFocusableTarget = focusableTargets.some(
      (el) => el?.getAttribute('tabindex') === '-1',
    );

    if (!hasFocusableTarget) {
      errors.push(
        'No focusable target found in the content area. Add tabindex="-1" to the main content container or its heading.',
      );
    }

    // Gather script content — prefer parsed DOM scripts, fall back to sourceHtml
    const scripts = Array.from(document.querySelectorAll('script'));
    const domScriptContent = scripts.map((s) => s.textContent ?? '').join('\n');
    const scriptContent = domScriptContent.trim()
      ? domScriptContent
      : (analysisResult?.sourceHtml ?? '');

    // Check 2: JavaScript must call .focus() after content updates
    const hasFocusCall = /\.focus\s*\(/.test(scriptContent);

    if (!hasFocusCall) {
      errors.push(
        'No .focus() call found. After updating the content, call .focus() on the target element to move focus there.',
      );
    }

    // Check 3: aria-current="page" must be DYNAMICALLY updated in JavaScript.
    // It must be both SET on the active link AND REMOVED from all others.
    const navLinks = document.querySelectorAll('nav a');

    if (navLinks.length > 0) {
      const setsAriaCurrent =
        /setAttribute\s*\(\s*['"]aria-current['"]\s*,\s*['"]page['"]/.test(
          scriptContent,
        ) || /\.ariaCurrent\s*=\s*['"]page['"]/.test(scriptContent);

      const removesAriaCurrent =
        /removeAttribute\s*\(\s*['"]aria-current['"]/.test(scriptContent) ||
        /\.ariaCurrent\s*=\s*['"](?!page['"])/.test(scriptContent) ||
        /\.ariaCurrent\s*=\s*['"]["']/.test(scriptContent) ||
        /\.ariaCurrent\s*=\s*null/.test(scriptContent) ||
        /setAttribute\s*\(\s*['"]aria-current['"]\s*,\s*['"]["']/.test(
          scriptContent,
        );

      if (!setsAriaCurrent) {
        errors.push(
          'aria-current="page" is not set in JavaScript. Use setAttribute("aria-current", "page") on the active link after navigation.',
        );
      } else if (!removesAriaCurrent) {
        errors.push(
          'aria-current="page" is set but never removed from other links. Remove aria-current from all nav links before setting it on the active one, so only one link is marked as current at a time.',
        );
      }
    }

    const passed = errors.length === 0;

    return {
      validatorId: 'focus-after-navigation',
      passed,
      message: passed
        ? 'Focus management after navigation is correctly implemented.'
        : `Focus management has ${errors.length} issue(s).`,
      details: passed ? undefined : errors.join('\n'),
    };
  },
};
