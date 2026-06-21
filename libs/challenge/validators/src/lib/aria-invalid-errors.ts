import type { Validator, ValidationResult } from '@practica11y/models';
import { simulateInvalidSubmit } from './form-interaction';

/** Tags that can hold text but are never themselves an error message. */
const NON_MESSAGE_TAGS = new Set([
  'LABEL',
  'BUTTON',
  'OPTION',
  'LEGEND',
  'SUMMARY',
  'INPUT',
  'SELECT',
  'TEXTAREA',
]);

/**
 * Validates that form error handling communicates errors programmatically,
 * not just visually.
 *
 * The check is **interaction-aware**: it first drives the form into its error
 * state via {@link simulateInvalidSubmit} (because accessible solutions apply
 * the relevant ARIA dynamically on submit), then verifies that:
 *
 * - At least one field is marked `aria-invalid="true"` (not merely present, and
 *   not `"false"`).
 * - Every field marked invalid references its error message via
 *   `aria-describedby` or `aria-errormessage`, and that referenced element
 *   exists and is not empty.
 * - **Every** visible error message is linked from an `aria-invalid="true"`
 *   field — so marking only some of the failing fields is not enough.
 */
export const ariaInvalidErrors: Validator = {
  id: 'aria-invalid-errors',

  validate(document: Document, _context?: unknown): ValidationResult {
    const initialInputs = document.querySelectorAll('input, select, textarea');
    if (initialInputs.length === 0) {
      return {
        validatorId: 'aria-invalid-errors',
        passed: false,
        message:
          'No form fields found. The page must contain a form to validate error handling.',
      };
    }

    // Drive the form into its error state so dynamically-applied ARIA can be
    // inspected on the rendered DOM.
    simulateInvalidSubmit(document);

    const issues: string[] = [];

    const fields = Array.from(
      document.querySelectorAll('input, select, textarea'),
    );
    const invalidFields = fields.filter(
      (field) => field.getAttribute('aria-invalid') === 'true',
    );

    if (invalidFields.length === 0) {
      issues.push(
        'After submitting invalid data, no field is marked aria-invalid="true". Set aria-invalid="true" on fields that contain errors.',
      );
    }

    // Each invalid field must be programmatically associated with a non-empty
    // error message.
    for (const field of invalidFields) {
      const ref =
        field.getAttribute('aria-describedby') ||
        field.getAttribute('aria-errormessage');

      if (!ref) {
        issues.push(
          `${describeInput(field)}: marked aria-invalid="true" but has no aria-describedby or aria-errormessage linking its error message.`,
        );
        continue;
      }

      const ids = ref.split(/\s+/).filter(Boolean);
      const missing = ids.filter((id) => !document.getElementById(id));
      if (missing.length > 0) {
        issues.push(
          `${describeInput(field)}: aria-describedby/aria-errormessage references non-existent ID(s): ${missing.join(', ')}.`,
        );
        continue;
      }

      const hasMessageText = ids.some((id) =>
        document.getElementById(id)?.textContent?.trim(),
      );
      if (!hasMessageText) {
        issues.push(
          `${describeInput(field)}: the referenced error message element is empty — it must contain the error text.`,
        );
      }
    }

    // Every visible error message must belong to a field that is marked
    // aria-invalid="true". This catches solutions that show an error for a
    // field but forget to mark that field (or to associate the message).
    const referencedIds = collectReferencedIds(invalidFields);
    for (const message of findVisibleErrorMessages(document)) {
      const id = message.id;
      if (!id || !referencedIds.has(id)) {
        issues.push(
          `An error message ("${truncate(message.textContent)}") is shown but is not linked from an aria-invalid="true" field. Mark every field that has an error and associate its message via aria-describedby.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'aria-invalid-errors',
      passed,
      message: passed
        ? 'Every invalid field exposes aria-invalid="true" and links its error message programmatically.'
        : `${issues.length} issue(s) with programmatic error communication.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/** Collects all element IDs referenced by the given fields' ARIA error hooks. */
function collectReferencedIds(fields: Element[]): Set<string> {
  const ids = new Set<string>();
  for (const field of fields) {
    const ref =
      field.getAttribute('aria-describedby') ||
      field.getAttribute('aria-errormessage');
    if (!ref) continue;
    for (const id of ref.split(/\s+/).filter(Boolean)) {
      ids.add(id);
    }
  }
  return ids;
}

/**
 * Finds elements inside any form that currently display error text. An error
 * message is a non-empty leaf element that is not a label, control, or button.
 */
function findVisibleErrorMessages(document: Document): Element[] {
  const messages: Element[] = [];
  for (const form of Array.from(document.querySelectorAll('form'))) {
    for (const el of Array.from(form.querySelectorAll('*'))) {
      if (NON_MESSAGE_TAGS.has(el.tagName)) continue;
      if (el.children.length > 0) continue; // leaf elements only
      if (el.textContent?.trim()) {
        messages.push(el);
      }
    }
  }
  return messages;
}

function truncate(text: string | null): string {
  const value = (text ?? '').trim();
  return value.length > 40 ? `${value.slice(0, 39)}…` : value;
}

function describeInput(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  const id = element.getAttribute('id');
  const parts = [`<${tag}>`];
  if (type) parts.push(`type="${type}"`);
  if (id) parts.push(`id="${id}"`);
  return parts.join(' ');
}
