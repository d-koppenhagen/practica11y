import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Valid autocomplete tokens per WCAG 2.1 SC 1.3.5 "Identify Input Purpose".
 * https://www.w3.org/TR/WCAG21/#input-purposes
 */
const VALID_AUTOCOMPLETE_TOKENS = new Set([
  'name',
  'honorific-prefix',
  'given-name',
  'additional-name',
  'family-name',
  'honorific-suffix',
  'nickname',
  'username',
  'new-password',
  'current-password',
  'one-time-code',
  'organization-title',
  'organization',
  'street-address',
  'address-line1',
  'address-line2',
  'address-line3',
  'address-level4',
  'address-level3',
  'address-level2',
  'address-level1',
  'country',
  'country-name',
  'postal-code',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-number',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type',
  'transaction-currency',
  'transaction-amount',
  'language',
  'bday',
  'bday-day',
  'bday-month',
  'bday-year',
  'sex',
  'url',
  'photo',
  'tel',
  'tel-country-code',
  'tel-national',
  'tel-area-code',
  'tel-local',
  'tel-local-prefix',
  'tel-local-suffix',
  'tel-extension',
  'email',
  'impp',
]);

/**
 * Selects input fields that typically collect personal user data
 * and should have autocomplete attributes per WCAG 2.1 SC 1.3.5.
 */
const PERSONAL_INPUT_SELECTOR = [
  'input[type="text"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[type="url"]',
  'input:not([type])',
].join(', ');

/**
 * Validates that form fields collecting personal data have appropriate
 * autocomplete attributes per WCAG 2.1 SC 1.3.5 "Identify Input Purpose".
 */
export const autocompleteAttributes: Validator = {
  id: 'autocomplete-attributes',

  validate(document: Document, _context?: unknown): ValidationResult {
    const inputs = Array.from(
      document.querySelectorAll(PERSONAL_INPUT_SELECTOR),
    );

    // Filter to only inputs inside a form (standard personal data collection)
    const formInputs = inputs.filter(
      (input) =>
        input.closest('form') !== null &&
        input.getAttribute('type') !== 'hidden' &&
        input.getAttribute('type') !== 'submit' &&
        input.getAttribute('type') !== 'button' &&
        input.getAttribute('type') !== 'reset',
    );

    if (formInputs.length === 0) {
      return {
        validatorId: 'autocomplete-attributes',
        passed: true,
        message: 'No form input fields found that require autocomplete.',
      };
    }

    const issues: string[] = [];

    for (const input of formInputs) {
      const autocomplete = input.getAttribute('autocomplete')?.trim();

      if (!autocomplete || autocomplete === 'off' || autocomplete === 'on') {
        issues.push(
          `${describeElement(input)} — missing or invalid autocomplete attribute`,
        );
      } else {
        // Validate that the token(s) are valid WCAG input purpose values
        const tokens = autocomplete.split(/\s+/);
        const lastToken = tokens[tokens.length - 1];
        if (!VALID_AUTOCOMPLETE_TOKENS.has(lastToken)) {
          issues.push(
            `${describeElement(input)} — unrecognized autocomplete token "${lastToken}"`,
          );
        }
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'autocomplete-attributes',
      passed,
      message: passed
        ? `All ${formInputs.length} form field(s) have valid autocomplete attributes.`
        : `${issues.length} of ${formInputs.length} field(s) missing or have invalid autocomplete attributes.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

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
