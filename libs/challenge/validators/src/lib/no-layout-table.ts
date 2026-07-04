import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that `<table>` elements are not used for visual layout purposes.
 *
 * A table used for layout is one that:
 * - Has no `<th>` elements (no real headers)
 * - Has no `<caption>` element
 * - Has no `role="presentation"` or `role="none"` (which would at least suppress semantics)
 * - Contains non-tabular content (navigation, paragraphs, generic content)
 *
 * The preferred fix is to replace the table with CSS layout (Grid/Flexbox).
 * An acceptable alternative is adding `role="presentation"` or `role="none"`.
 */
export const noLayoutTable: Validator = {
  id: 'no-layout-table',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    const tables = Array.from(document.querySelectorAll('table'));

    for (const table of tables) {
      const role = table.getAttribute('role');

      // Tables with role="presentation" or role="none" are acceptable
      // (they suppress table semantics intentionally)
      if (role === 'presentation' || role === 'none') {
        continue;
      }

      const hasHeaders = table.querySelectorAll('th').length > 0;
      const hasCaption = table.querySelector('caption') !== null;

      // If the table has headers or a caption, it's likely a data table — skip
      if (hasHeaders || hasCaption) {
        continue;
      }

      // A table without headers/caption is likely used for layout
      issues.push(
        'A <table> element is used without any table headers (<th>) or <caption>. ' +
          'If this table contains layout content (not tabular data), replace it with ' +
          'CSS Grid or Flexbox. If a table must remain for legacy reasons, add ' +
          'role="presentation" to suppress table semantics.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'no-layout-table',
      passed,
      message: passed
        ? 'No layout tables detected — tables are used correctly.'
        : `${issues.length} layout table(s) found without proper semantics.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
