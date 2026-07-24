import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that links have descriptive, meaningful text rather than
 * generic phrases like "Click here", "Read more", or "Learn more".
 *
 * Link text must make sense out of context (e.g. in a screen reader's
 * links list / rotor). Generic phrases violate WCAG 2.4.4 (Link Purpose)
 * because they provide no information about the link's destination.
 *
 * The validator checks both visible text and aria-label for generic patterns.
 * Links that use aria-label with descriptive text are considered valid even
 * if the visible text is generic.
 */
export const descriptiveLinkText: Validator = {
  id: 'descriptive-link-text',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    const links = Array.from(document.querySelectorAll('a[href]'));

    for (const link of links) {
      const accessibleName = getAccessibleName(link);

      if (!accessibleName) {
        // Empty link text is caught by interactive-element-name validator
        continue;
      }

      if (isGenericLinkText(accessibleName)) {
        const href = link.getAttribute('href') ?? '';
        issues.push(
          `Link "${accessibleName}" (href="${href}") uses generic text. ` +
            `Rewrite it to describe the destination or use aria-label for a descriptive accessible name.`,
        );
      }
    }

    // Also check for duplicate link text (all links saying the same thing)
    const accessibleNames = links
      .map((link) => getAccessibleName(link))
      .filter((name): name is string => !!name && !isGenericLinkText(name));

    const duplicates = findDuplicates(accessibleNames);
    for (const [name, count] of duplicates) {
      issues.push(
        `${count} links share the same accessible name "${name}". ` +
          `Each link should have a unique name to help users distinguish them.`,
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'descriptive-link-text',
      passed,
      message: passed
        ? 'All links have descriptive, unique text.'
        : `${issues.length} link text issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Generic link text patterns that violate WCAG 2.4.4.
 * Matched case-insensitively against the full accessible name.
 */
const GENERIC_PATTERNS: RegExp[] = [
  /^click\s*here$/i,
  /^here$/i,
  /^read\s*more$/i,
  /^learn\s*more$/i,
  /^more$/i,
  /^more\s*info$/i,
  /^more\s*information$/i,
  /^details$/i,
  /^link$/i,
  /^this\s*link$/i,
  /^go$/i,
  /^go\s*here$/i,
  /^see\s*more$/i,
  /^find\s*out\s*more$/i,
  /^continue$/i,
  /^continue\s*reading$/i,
];

function isGenericLinkText(text: string): boolean {
  const trimmed = text.trim();
  return GENERIC_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Gets the accessible name for a link element, following the
 * accessible name computation priority:
 * 1. aria-label
 * 2. aria-labelledby
 * 3. Visible text content (excluding aria-hidden)
 * 4. title attribute
 */
function getAccessibleName(element: Element): string | null {
  // 1. aria-label takes priority
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return ariaLabel.trim();
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
      return labelText;
    }
  }

  // 3. Visible text content
  const visibleText = getVisibleTextContent(element);
  if (visibleText.length > 0) {
    return visibleText;
  }

  // 4. title attribute as fallback
  const title = element.getAttribute('title');
  if (title && title.trim().length > 0) {
    return title.trim();
  }

  // 5. img alt text
  const img = element.querySelector('img[alt]');
  if (img) {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim().length > 0) {
      return alt.trim();
    }
  }

  return null;
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

function findDuplicates(names: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const name of names) {
    const lower = name.toLowerCase();
    counts.set(lower, (counts.get(lower) ?? 0) + 1);
  }

  const duplicates = new Map<string, number>();
  for (const [name, count] of counts) {
    if (count > 1) {
      duplicates.set(name, count);
    }
  }

  return duplicates;
}
