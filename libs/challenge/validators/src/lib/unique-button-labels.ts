import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that buttons on the page have unique accessible names.
 * Multiple buttons with the same accessible name (e.g. "Edit", "Edit", "Edit")
 * are indistinguishable to screen reader users navigating via the button list/rotor.
 */
export const uniqueButtonLabels: Validator = {
  id: 'unique-button-labels',

  validate(document: Document): ValidationResult {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nameMap = new Map<string, Element[]>();

    for (const button of buttons) {
      const name = getAccessibleName(button, document);
      if (!name) continue; // Empty names are caught by interactive-element-name validator

      const normalized = name.toLowerCase().trim();
      const existing = nameMap.get(normalized) ?? [];
      existing.push(button);
      nameMap.set(normalized, existing);
    }

    const issues: string[] = [];

    for (const [name, elements] of nameMap) {
      if (elements.length > 1) {
        issues.push(
          `${elements.length} buttons share the accessible name "${name}". Each button must have a unique name so screen reader users can distinguish them.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'unique-button-labels',
      passed,
      message: passed
        ? 'All buttons have unique accessible names.'
        : `${issues.length} group(s) of buttons share ambiguous names.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Computes the accessible name of a button following a simplified
 * version of the Accessible Name and Description Computation algorithm.
 */
function getAccessibleName(element: Element, doc: Document): string {
  // 1. aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/);
    const labelText = ids
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    if (labelText.length > 0) {
      return labelText;
    }
  }

  // 2. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return ariaLabel.trim();
  }

  // 3. title attribute
  const title = element.getAttribute('title');
  if (title && title.trim().length > 0) {
    return title.trim();
  }

  // 4. Text content (including visually hidden text, excluding aria-hidden)
  return getVisibleTextContent(element).trim();
}

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
