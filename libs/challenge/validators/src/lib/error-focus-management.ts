import type { Validator, ValidationResult } from '@practica11y/models';
import { simulateInvalidSubmit } from './form-interaction';

const FORM_FIELD_TAGS = new Set(['input', 'select', 'textarea']);

/**
 * Validates that focus is moved to the first invalid field after an invalid
 * form submission.
 *
 * The check is **interaction-aware**: it drives the form into its error state
 * via {@link simulateInvalidSubmit}, then inspects `document.activeElement`.
 * A correct solution calls `.focus()` on the first field that has an error, so
 * keyboard and screen reader users land directly on the problem.
 */
export const errorFocusManagement: Validator = {
  id: 'error-focus-management',

  validate(document: Document, _context?: unknown): ValidationResult {
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
      return {
        validatorId: 'error-focus-management',
        passed: false,
        message:
          'No form found. The page must contain a form to validate focus management.',
      };
    }

    simulateInvalidSubmit(document);

    const active = document.activeElement;
    const isFormField =
      !!active && FORM_FIELD_TAGS.has(active.tagName.toLowerCase());

    if (!active || active === document.body || !isFormField) {
      return {
        validatorId: 'error-focus-management',
        passed: false,
        message:
          'After submitting invalid data, focus was not moved to a form field. Move focus to the first invalid field with .focus().',
      };
    }

    if (active.getAttribute('aria-invalid') !== 'true') {
      return {
        validatorId: 'error-focus-management',
        passed: false,
        message:
          'Focus moved to a field, but it is not marked aria-invalid="true". Focus the first field that has an error.',
      };
    }

    // Ensure focus landed on the FIRST invalid field in document order.
    const fields = Array.from(
      document.querySelectorAll('input, select, textarea'),
    );
    const firstInvalid = fields.find(
      (field) => field.getAttribute('aria-invalid') === 'true',
    );

    if (firstInvalid && firstInvalid !== active) {
      return {
        validatorId: 'error-focus-management',
        passed: false,
        message:
          'Focus was moved to an invalid field, but not the first one. Focus the first invalid field in document order.',
      };
    }

    return {
      validatorId: 'error-focus-management',
      passed: true,
      message: 'Focus moves to the first invalid field after an invalid submit.',
    };
  },
};
