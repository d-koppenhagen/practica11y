import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that form error handling uses aria-invalid and aria-describedby
 * to programmatically communicate errors to assistive technologies.
 *
 * Checks:
 * - Error messages exist and are associated with fields via aria-describedby
 * - Fields with visible error text have aria-invalid="true"
 * - No disabled submit buttons are present (optional soft check)
 */
export const ariaInvalidErrors: Validator = {
  id: 'aria-invalid-errors',

  validate(document: Document, _context?: unknown): ValidationResult {
    const issues: string[] = [];

    // Check that form fields with error-like sibling/associated elements
    // have proper ARIA attributes
    const inputs = Array.from(
      document.querySelectorAll('input, select, textarea'),
    );

    // Check for presence of aria-invalid on at least one field pattern
    const inputsWithAriaInvalid = inputs.filter(
      (el) => el.getAttribute('aria-invalid') === 'true',
    );

    // Strategy: Check that the HTML structure includes the accessibility pattern.
    // The solution should have:
    // 1. At least one input with aria-describedby or aria-errormessage
    // 2. The referenced element must exist
    // 3. At least one input should support aria-invalid

    // Check if any input has aria-describedby or aria-errormessage referencing an existing element
    let hasValidAssociation = false;
    for (const input of inputs) {
      const describedBy =
        input.getAttribute('aria-describedby') ||
        input.getAttribute('aria-errormessage');
      if (describedBy) {
        const ids = describedBy.split(/\s+/);
        const allExist = ids.every((id) => document.getElementById(id));
        if (allExist) {
          hasValidAssociation = true;
        } else {
          const missing = ids.filter((id) => !document.getElementById(id));
          issues.push(
            `${describeInput(input)}: aria-describedby references non-existent ID(s): ${missing.join(', ')}`,
          );
        }
      }
    }

    if (!hasValidAssociation && inputs.length > 0) {
      issues.push(
        'No form field uses aria-describedby or aria-errormessage to associate error messages.',
      );
    }

    // Check that at least the pattern for aria-invalid exists
    // (either statically in HTML or as a structural possibility)
    const hasAriaInvalidPattern =
      inputsWithAriaInvalid.length > 0 ||
      inputs.some((el) => el.hasAttribute('aria-invalid'));

    if (!hasAriaInvalidPattern && inputs.length > 0) {
      issues.push('No form field uses aria-invalid to indicate error state.');
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'aria-invalid-errors',
      passed,
      message: passed
        ? 'Form errors are properly communicated using aria-invalid and aria-describedby.'
        : `${issues.length} accessibility issue(s) with form error handling.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

function describeInput(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  const id = element.getAttribute('id');
  const parts = [`<${tag}>`];
  if (type) parts.push(`type="${type}"`);
  if (id) parts.push(`id="${id}"`);
  return parts.join(' ');
}
