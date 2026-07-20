import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that every <section> element has an accessible name via
 * aria-label or aria-labelledby. Without one, the section is exposed
 * as role="generic" rather than role="region" in the accessibility tree,
 * making it invisible to landmark navigation.
 */
export const sectionAccessibleName: Validator = {
  id: 'section-accessible-name',

  validate(document: Document): ValidationResult {
    const sections = document.querySelectorAll('section');
    const issues: string[] = [];

    for (const section of sections) {
      const ariaLabel = (section.getAttribute('aria-label') ?? '').trim();
      const ariaLabelledBy = (
        section.getAttribute('aria-labelledby') ?? ''
      ).trim();

      if (!ariaLabel && !ariaLabelledBy) {
        issues.push(
          `<section> without an accessible name (aria-label or aria-labelledby) is exposed as role="generic", not as a "region" landmark. ` +
            `Add a descriptive aria-label to make it a meaningful landmark.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'section-accessible-name',
      passed,
      message: passed
        ? 'All <section> elements have an accessible name and are exposed as region landmarks.'
        : `${issues.length} <section> element(s) missing an accessible name.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
