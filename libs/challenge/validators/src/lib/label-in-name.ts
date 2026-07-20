import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates WCAG 2.5.3 "Label in Name" — the accessible name of interactive
 * elements must contain the visible text. When an aria-label is present, it
 * must include the element's visible text content as a substring (case-insensitive).
 *
 * This ensures voice control users can activate controls by speaking the
 * visible label, and screen reader users hear a name consistent with what
 * they (or a sighted helper) can see on screen.
 */
export const labelInName: Validator = {
  id: 'label-in-name',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    const interactiveElements = Array.from(
      document.querySelectorAll('button, a, [role="button"], [role="link"]'),
    );

    for (const element of interactiveElements) {
      const ariaLabel = element.getAttribute('aria-label');
      if (!ariaLabel) {
        // No aria-label override — visible text IS the accessible name, no mismatch possible
        continue;
      }

      const visibleText = getVisibleTextContent(element).trim();
      if (!visibleText) {
        // No visible text — label-in-name does not apply (other validators handle empty names)
        continue;
      }

      const normalizedAriaLabel = ariaLabel.trim().toLowerCase();
      const normalizedVisibleText = visibleText.toLowerCase();

      if (!normalizedAriaLabel.includes(normalizedVisibleText)) {
        const tagName = element.tagName.toLowerCase();
        issues.push(
          `<${tagName}> with visible text "${visibleText}" has aria-label="${ariaLabel}" which does not contain the visible text. ` +
            `Either remove the aria-label or ensure it includes "${visibleText}".`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'label-in-name',
      passed,
      message: passed
        ? 'All interactive elements satisfy Label in Name (WCAG 2.5.3).'
        : `${issues.length} element(s) have an accessible name that does not contain the visible text.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Gets text content excluding elements with aria-hidden="true".
 */
function getVisibleTextContent(element: Element): string {
  let text = '';

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.getAttribute('aria-hidden') === 'true') {
        continue;
      }
      text += getVisibleTextContent(el);
    }
  }

  return text;
}
