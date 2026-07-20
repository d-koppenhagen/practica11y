import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that a progress indicator is accessible to assistive technology.
 * Checks for:
 * 1. A native <progress> element OR an element with role="progressbar"
 * 2. Proper value attributes (value/max for <progress>, or aria-valuenow/aria-valuemin/aria-valuemax for role="progressbar")
 * 3. An accessible label (aria-label or aria-labelledby)
 * 4. A visible text equivalent of the progress value
 */
export const progressbarAccessible: Validator = {
  id: 'progressbar-accessible',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Find native <progress> elements or elements with role="progressbar"
    const nativeProgress = Array.from(document.querySelectorAll('progress'));
    const ariaProgressbars = Array.from(
      document.querySelectorAll('[role="progressbar"]'),
    );

    const allProgressbars = [...nativeProgress, ...ariaProgressbars];

    if (allProgressbars.length === 0) {
      issues.push(
        'No accessible progress indicator found. Use a native <progress> element or add role="progressbar" to the progress container.',
      );
    }

    for (const element of nativeProgress) {
      // Check value and max attributes
      if (!element.hasAttribute('value')) {
        issues.push(
          '<progress> element is missing the "value" attribute. Set it to the current progress value.',
        );
      }

      if (!element.hasAttribute('max')) {
        issues.push(
          '<progress> element is missing the "max" attribute. Set it to the maximum value (e.g. "100").',
        );
      }

      // Check accessible label
      if (!hasAccessibleLabel(element)) {
        issues.push(
          '<progress> element has no accessible label. Add aria-label or aria-labelledby to describe what the bar represents.',
        );
      }
    }

    for (const element of ariaProgressbars) {
      // Check required ARIA value attributes
      if (!element.hasAttribute('aria-valuenow')) {
        issues.push(
          'Element with role="progressbar" is missing "aria-valuenow". Set it to the current progress value.',
        );
      }

      if (!element.hasAttribute('aria-valuemin')) {
        issues.push(
          'Element with role="progressbar" is missing "aria-valuemin". Set it to the minimum value (e.g. "0").',
        );
      }

      if (!element.hasAttribute('aria-valuemax')) {
        issues.push(
          'Element with role="progressbar" is missing "aria-valuemax". Set it to the maximum value (e.g. "100").',
        );
      }

      // Check accessible label
      if (!hasAccessibleLabel(element)) {
        issues.push(
          'Element with role="progressbar" has no accessible label. Add aria-label or aria-labelledby to describe what the bar represents.',
        );
      }
    }

    // Check for visible text equivalent of the progress value
    if (allProgressbars.length > 0 && !hasVisibleProgressText(document)) {
      issues.push(
        'No visible text equivalent of the progress value found. Provide a visible percentage (e.g. "65%") alongside the progress bar.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'progressbar-accessible',
      passed,
      message: passed
        ? 'Progress bar is accessible with proper role, values, label, and visible text.'
        : `${issues.length} progress bar accessibility issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Checks if an element has an accessible label via aria-label or aria-labelledby.
 */
function hasAccessibleLabel(element: Element): boolean {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return true;
  }

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

  return false;
}

/**
 * Checks if there is visible text content representing a percentage or numeric
 * progress value outside of <progress> elements. The fallback text inside
 * <progress> is not shown visually in supporting browsers, so it does not
 * count as a visible text equivalent.
 */
function hasVisibleProgressText(document: Document): boolean {
  const body = document.body;
  if (!body) return false;

  // Clone the body and remove <progress> elements to exclude their fallback text
  const clone = body.cloneNode(true) as HTMLElement;
  for (const progress of Array.from(clone.querySelectorAll('progress'))) {
    progress.textContent = '';
  }

  const textContent = clone.textContent ?? '';
  // Match percentage patterns like "65%", "65 %", "100%"
  return /\d+\s?%/.test(textContent);
}
