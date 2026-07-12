import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that no elements use positive tabindex values and that
 * skip-link targets use tabindex="-1" for programmatic focus.
 * Positive tabindex (1, 2, 3, …) creates unpredictable focus order
 * and violates WCAG 2.4.3 Focus Order.
 */
export const noPositiveTabindex: Validator = {
  id: 'no-positive-tabindex',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Check for positive tabindex values
    const elementsWithPositiveTabindex = Array.from(
      document.querySelectorAll('[tabindex]'),
    ).filter((el) => {
      const value = parseInt(el.getAttribute('tabindex') ?? '', 10);
      return value > 0;
    });

    for (const el of elementsWithPositiveTabindex) {
      const tag = el.tagName.toLowerCase();
      const tabindex = el.getAttribute('tabindex');
      const text = el.textContent?.trim().slice(0, 40) || '';
      issues.push(
        `<${tag}> with tabindex="${tabindex}"${text ? ` ("${text}")` : ''}: positive tabindex creates unpredictable focus order`,
      );
    }

    // Check that skip-link targets use tabindex="-1"
    const skipLinks = Array.from(
      document.querySelectorAll('a[href^="#"]'),
    ).filter((link) => link.textContent?.toLowerCase().includes('skip'));

    for (const link of skipLinks) {
      const targetId = link.getAttribute('href')?.slice(1);
      if (!targetId) continue;

      const target = document.getElementById(targetId);
      if (!target) continue;

      const tabindex = target.getAttribute('tabindex');
      if (tabindex !== '-1') {
        const tag = target.tagName.toLowerCase();
        const currentValue = tabindex === null ? 'none' : tabindex;
        issues.push(
          `<${tag} id="${targetId}"> is a skip-link target but has tabindex="${currentValue}" instead of tabindex="-1". Skip-link targets need tabindex="-1" to receive focus programmatically without being in the tab order.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'no-positive-tabindex',
      passed,
      message: passed
        ? 'No positive tabindex values found. Focus order follows DOM order.'
        : `${issues.length} tabindex issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
