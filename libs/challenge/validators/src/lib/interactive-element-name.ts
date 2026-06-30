import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that all interactive elements (buttons, links) have an accessible name.
 * An element without visible text, aria-label, aria-labelledby, or a meaningful
 * img alt is "empty" to screen readers — they announce just "button" or "link".
 */
export const interactiveElementName: Validator = {
  id: 'interactive-element-name',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    const buttons = Array.from(document.querySelectorAll('button'));
    const links = Array.from(document.querySelectorAll('a'));

    for (const button of buttons) {
      if (!hasAccessibleName(button)) {
        issues.push(
          `<button> ${describeElement(button)} has no accessible name. Add aria-label, aria-labelledby, or visible text.`,
        );
      }
    }

    for (const link of links) {
      if (!hasAccessibleName(link)) {
        issues.push(
          `<a> ${describeElement(link)} has no accessible name. Add aria-label, aria-labelledby, alt text on an <img>, or visible text.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'interactive-element-name',
      passed,
      message: passed
        ? 'All interactive elements have an accessible name.'
        : `${issues.length} interactive element(s) without an accessible name.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Determines whether an element has an accessible name through any of:
 * - aria-label attribute (non-empty)
 * - aria-labelledby pointing to an element with text
 * - title attribute (non-empty)
 * - Visible text content (excluding aria-hidden children)
 * - An <img> child with non-empty alt text
 */
function hasAccessibleName(element: Element): boolean {
  // 1. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return true;
  }

  // 2. aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const doc = element.ownerDocument;
    const ids = labelledBy.split(/\s+/);
    const labelText = ids
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    if (labelText.length > 0) {
      return true;
    }
  }

  // 3. title attribute
  const title = element.getAttribute('title');
  if (title && title.trim().length > 0) {
    return true;
  }

  // 4. <img> child with alt text
  const images = element.querySelectorAll('img');
  for (const img of images) {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim().length > 0) {
      return true;
    }
  }

  // 5. Visible text content (excluding aria-hidden elements)
  const visibleText = getVisibleTextContent(element);
  if (visibleText.length > 0) {
    return true;
  }

  return false;
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

  return text.trim();
}

function describeElement(element: Element): string {
  const href = element.getAttribute('href');
  const classes = element.getAttribute('class');

  const parts: string[] = [];
  if (href) parts.push(`href="${href}"`);
  if (classes) parts.push(`class="${classes}"`);

  if (parts.length === 0) {
    // Describe by child content
    const firstChild = element.firstElementChild;
    if (firstChild) {
      parts.push(`containing <${firstChild.tagName.toLowerCase()}>`);
    }
  }

  return parts.length > 0 ? `(${parts.join(', ')})` : '';
}
