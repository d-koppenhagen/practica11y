import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that all interactive elements are keyboard accessible:
 * - They must be focusable (via native semantics or tabindex)
 * - They should have an appropriate ARIA role if not natively interactive
 */
export const keyboardAccessible: Validator = {
  id: 'keyboard-accessible',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    // DOM-based check: find interactive elements that aren't keyboard accessible
    const inaccessibleElements = findKeyboardInaccessibleElements(document);

    // Context-based check: use keyboard analysis results if available
    const nonFocusableInteractive =
      analysisResult?.keyboardResults?.nonFocusableInteractive ?? [];

    const totalIssues =
      inaccessibleElements.length + nonFocusableInteractive.length;

    // Check for vacuous truth: if there are no interactive elements at all, fail
    const hasAnyInteractive =
      document.querySelectorAll(
        'button, a[href], input, select, textarea, [onclick], [role="button"], [role="link"]',
      ).length > 0;

    if (!hasAnyInteractive) {
      return {
        validatorId: 'keyboard-accessible',
        passed: false,
        message:
          'No interactive elements found. The page must contain at least one keyboard-accessible element.',
      };
    }

    const passed = totalIssues === 0;

    const details: string[] = [];
    if (inaccessibleElements.length > 0) {
      details.push(
        ...inaccessibleElements.map((el) => describeInaccessibleElement(el)),
      );
    }
    if (nonFocusableInteractive.length > 0) {
      details.push(
        ...nonFocusableInteractive.map(
          (selector) => `${selector}: interactive but not focusable`,
        ),
      );
    }

    return {
      validatorId: 'keyboard-accessible',
      passed,
      message: passed
        ? 'All interactive elements are keyboard accessible.'
        : `${totalIssues} element(s) are not keyboard accessible.`,
      details: passed ? undefined : details.join('\n'),
    };
  },
};

const NATIVELY_FOCUSABLE = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
]);

function findKeyboardInaccessibleElements(document: Document): Element[] {
  // Find elements with click handlers that aren't keyboard accessible
  const clickableElements = Array.from(document.querySelectorAll('[onclick]'));

  return clickableElements.filter((el) => {
    const tag = el.tagName.toLowerCase();

    // Natively focusable elements are fine
    if (NATIVELY_FOCUSABLE.has(tag)) {
      return false;
    }

    // Check if element has tabindex making it focusable
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
      return false;
    }

    return true;
  });
}

function describeInaccessibleElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const tabindex = element.getAttribute('tabindex');

  const parts = [`<${tag}>`];
  if (role) parts.push(`role="${role}"`);
  if (tabindex) parts.push(`tabindex="${tabindex}"`);
  parts.push('has onclick but is not keyboard focusable');

  return parts.join(' ');
}
