import type { Validator, ValidationResult } from '@practica11y/models';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Validates that a modal dialog has proper focus trap structure:
 * - A dialog element exists (role="dialog" or <dialog>)
 * - It has aria-modal="true"
 * - It contains at least one focusable element
 * - It has an accessible name (aria-label or aria-labelledby)
 */
export const focusTrapImplemented: Validator = {
  id: 'focus-trap-implemented',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Find dialog elements: role="dialog" or native <dialog>
    const dialogElements = Array.from(
      document.querySelectorAll('[role="dialog"], dialog'),
    );

    if (dialogElements.length === 0) {
      return {
        validatorId: 'focus-trap-implemented',
        passed: false,
        message:
          'No dialog element found. Add role="dialog" to the modal container or use a <dialog> element.',
      };
    }

    for (const dialog of dialogElements) {
      // Check aria-modal="true"
      if (dialog.getAttribute('aria-modal') !== 'true') {
        issues.push(`Dialog element is missing aria-modal="true".`);
      }

      // Check for accessible name
      const hasAriaLabel = dialog.hasAttribute('aria-label');
      const hasAriaLabelledBy = dialog.hasAttribute('aria-labelledby');
      if (!hasAriaLabel && !hasAriaLabelledBy) {
        issues.push(
          `Dialog element is missing an accessible name. Add aria-label or aria-labelledby.`,
        );
      }

      // Check aria-labelledby references a valid element
      if (hasAriaLabelledBy) {
        const labelledById = dialog.getAttribute('aria-labelledby');
        if (labelledById && !document.getElementById(labelledById)) {
          issues.push(
            `aria-labelledby references "${labelledById}" but no element with that id was found.`,
          );
        }
      }

      // Check for focusable elements within the dialog
      const focusableElements = dialog.querySelectorAll(FOCUSABLE_SELECTORS);
      if (focusableElements.length === 0) {
        issues.push(
          `Dialog contains no focusable elements. A focus trap requires at least one focusable element inside the dialog.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'focus-trap-implemented',
      passed,
      message: passed
        ? 'Dialog has proper focus trap structure with role, aria-modal, accessible name, and focusable elements.'
        : `${issues.length} issue(s) found with dialog focus trap implementation.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
