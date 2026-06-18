import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that clickable elements use semantic <button> or <a> elements
 * instead of non-interactive elements like <div> or <span> with onclick handlers.
 * Also verifies that at least one semantic interactive element exists.
 */
export const semanticButton: Validator = {
  id: 'semantic-button',

  validate(document: Document, _context?: unknown): ValidationResult {
    const nonSemanticClickables = findNonSemanticClickables(document);
    const semanticInteractives = findSemanticInteractives(document);

    if (nonSemanticClickables.length > 0) {
      return {
        validatorId: 'semantic-button',
        passed: false,
        message: `${nonSemanticClickables.length} element(s) use non-semantic click handlers instead of <button> or <a>.`,
        details: nonSemanticClickables
          .map((el) => describeElement(el))
          .join('\n'),
      };
    }

    if (semanticInteractives.length === 0) {
      return {
        validatorId: 'semantic-button',
        passed: false,
        message:
          'No semantic interactive element (<button> or <a>) found. The page must contain at least one.',
      };
    }

    return {
      validatorId: 'semantic-button',
      passed: true,
      message: 'All clickable elements use semantic HTML.',
    };
  },
};

const INTERACTIVE_ELEMENTS = new Set([
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'summary',
]);

function findNonSemanticClickables(document: Document): Element[] {
  const allElements = Array.from(document.querySelectorAll('[onclick]'));

  return allElements.filter((el) => {
    const tag = el.tagName.toLowerCase();

    // Semantic interactive elements are fine
    if (INTERACTIVE_ELEMENTS.has(tag)) {
      return false;
    }

    // Elements with role="button" or role="link" are acceptable
    const role = el.getAttribute('role');
    if (role === 'button' || role === 'link') {
      return false;
    }

    return true;
  });
}

function findSemanticInteractives(document: Document): Element[] {
  return Array.from(
    document.querySelectorAll(
      'button, a[href], [role="button"], [role="link"]',
    ),
  );
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const classes = element.getAttribute('class');
  const id = element.getAttribute('id');

  const parts = [`<${tag}>`];
  if (id) parts.push(`id="${id}"`);
  if (classes) parts.push(`class="${classes}"`);
  parts.push('has onclick but is not a semantic interactive element');

  return parts.join(' ');
}
