import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that submit buttons are not disabled.
 * Disabled buttons are inaccessible because:
 * - They are not focusable via keyboard
 * - They provide no explanation for why submission is blocked
 * - Screen reader users may not discover them
 *
 * The better pattern is to keep the button enabled and validate on submit.
 */
export const noDisabledSubmit: Validator = {
  id: 'no-disabled-submit',

  validate(document: Document, _context?: unknown): ValidationResult {
    const issues: string[] = [];

    // Find all submit buttons (button[type=submit], input[type=submit], or button without type inside a form)
    const submitButtons = Array.from(
      document.querySelectorAll(
        'button[type="submit"], input[type="submit"], form button:not([type="button"]):not([type="reset"])',
      ),
    );

    if (submitButtons.length === 0) {
      return {
        validatorId: 'no-disabled-submit',
        passed: false,
        message: 'No submit button found. The form needs a submit button.',
      };
    }

    const disabledButtons = submitButtons.filter(
      (btn) =>
        btn.hasAttribute('disabled') ||
        btn.getAttribute('aria-disabled') === 'true',
    );

    if (disabledButtons.length > 0) {
      issues.push(
        `${disabledButtons.length} submit button(s) are disabled. Keep submit buttons enabled and validate on submit instead.`,
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'no-disabled-submit',
      passed,
      message: passed
        ? 'Submit button is enabled and accessible.'
        : 'Submit button should not be disabled.',
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
