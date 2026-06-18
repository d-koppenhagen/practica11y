import type { Validator, ValidationResult } from '@practica11y/models';

const FORM_INPUT_SELECTORS = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
  'select',
  'textarea',
].join(', ');

/**
 * Validates that all form fields have associated labels.
 */
export const formLabels: Validator = {
  id: 'form-labels',

  validate(document: Document, _context?: unknown): ValidationResult {
    const inputs = Array.from(document.querySelectorAll(FORM_INPUT_SELECTORS));

    if (inputs.length === 0) {
      return {
        validatorId: 'form-labels',
        passed: true,
        message: 'No form fields found.',
      };
    }

    const unlabeled = inputs.filter((input) => !hasLabel(input, document));
    const passed = unlabeled.length === 0;

    return {
      validatorId: 'form-labels',
      passed,
      message: passed
        ? `All ${inputs.length} form field(s) have labels.`
        : `${unlabeled.length} of ${inputs.length} form field(s) missing labels.`,
      details: passed
        ? undefined
        : unlabeled.map((el) => describeElement(el)).join('\n'),
    };
  },
};

function hasLabel(element: Element, document: Document): boolean {
  // Check aria-label
  if (element.getAttribute('aria-label')) {
    return true;
  }

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement && labelElement.textContent?.trim()) {
      return true;
    }
  }

  // Check associated <label> via for/id
  const id = element.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label && label.textContent?.trim()) {
      return true;
    }
  }

  // Check wrapping <label>
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return true;
  }

  // Check title attribute as fallback
  if (element.getAttribute('title')) {
    return true;
  }

  return false;
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  const name = element.getAttribute('name');
  const id = element.getAttribute('id');

  const parts = [tag];
  if (type) parts.push(`type="${type}"`);
  if (name) parts.push(`name="${name}"`);
  if (id) parts.push(`id="${id}"`);

  return parts.join(' ');
}
