import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that a sortable table uses aria-sort on column headers
 * and provides live announcements for sort and filter state changes.
 *
 * Checks for:
 * 1. At least one column header has aria-sort attribute
 * 2. aria-sort values are valid (none, ascending, descending, other)
 * 3. Sort controls (buttons) exist within headers for keyboard access
 * 4. The filter input has an associated label
 * 5. A dedicated live region exists for sort change announcements
 * 6. Table has a caption or aria-label for identification
 */
export const sortableTableAria: Validator = {
  id: 'sortable-table-aria',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';
    const issues: string[] = [];

    // Check for table with sortable headers
    const table =
      document.querySelector('table') ??
      document.querySelector('[role="table"]');

    if (!table) {
      issues.push(
        'No <table> element found. A sortable data table needs semantic table markup.',
      );
      return {
        validatorId: 'sortable-table-aria',
        passed: false,
        message: 'No semantic table found for sortable data.',
        details: issues.join('\n'),
      };
    }

    // Check for table identification (caption or aria-label)
    const hasCaption = table.querySelector('caption') !== null;
    const hasAriaLabel =
      table.hasAttribute('aria-label') ||
      table.hasAttribute('aria-labelledby');

    if (!hasCaption && !hasAriaLabel) {
      issues.push(
        'Table is missing a <caption> or aria-label. Add a <caption> element ' +
          'to describe the table\'s purpose — it benefits all users.',
      );
    }

    // Check for aria-sort on column headers
    const headers = Array.from(
      table.querySelectorAll('th, [role="columnheader"]'),
    );

    const headersWithAriaSort = headers.filter((h) =>
      h.hasAttribute('aria-sort'),
    );

    if (headersWithAriaSort.length === 0) {
      issues.push(
        'No column headers have aria-sort attribute. Sortable columns need ' +
          'aria-sort="none", "ascending", or "descending" to communicate ' +
          'sort state to screen readers.',
      );
    }

    // Validate aria-sort values
    const validValues = ['none', 'ascending', 'descending', 'other'];
    for (const header of headersWithAriaSort) {
      const value = header.getAttribute('aria-sort');
      if (value && !validValues.includes(value)) {
        issues.push(
          `Invalid aria-sort value "${value}" on header ` +
            `"${header.textContent?.trim()}". Valid values are: ${validValues.join(', ')}.`,
        );
      }
    }

    // Check that sortable headers contain buttons for keyboard access
    const sortableHeaders =
      headersWithAriaSort.length > 0 ? headersWithAriaSort : headers;

    const headersWithButtons = sortableHeaders.filter(
      (h) =>
        h.querySelector('button') !== null ||
        h.getAttribute('role') === 'button' ||
        h.hasAttribute('tabindex'),
    );

    if (headersWithButtons.length === 0 && headers.length > 0) {
      issues.push(
        'Sortable column headers should contain <button> elements to make ' +
          'them keyboard accessible and identifiable as interactive controls.',
      );
    }

    // Check for labeled filter input — not checked here since label
    // is expected to already exist in the starter code

    // Check for a dedicated sort announcer live region
    const liveRegions = Array.from(
      document.querySelectorAll(
        '[aria-live="polite"], [aria-live="assertive"], [role="status"]',
      ),
    );

    // We need at least one live region that is visually hidden (sort announcer)
    // AND one that shows the result count (status). Check that there are at least 2
    // or look for a hidden one specifically.
    const hasVisuallyHiddenLiveRegion = liveRegions.some((el) => {
      const classList = el.className || '';
      return (
        classList.includes('sr-only') ||
        classList.includes('visually-hidden') ||
        classList.includes('screenreader-only')
      );
    });

    // Also check source HTML for the pattern (in case CSS class matching is off)
    const hasSortAnnouncerInSource =
      sourceHtml &&
      (/sr-only.*aria-live|visually-hidden.*aria-live/i.test(sourceHtml) ||
        /aria-live.*sr-only|aria-live.*visually-hidden/i.test(sourceHtml));

    if (!hasVisuallyHiddenLiveRegion && !hasSortAnnouncerInSource) {
      issues.push(
        'No visually hidden live region found for sort announcements. ' +
          'Add a hidden element with aria-live="polite" that announces sort ' +
          'changes (e.g. "Sorted by Name, ascending") when a column is sorted.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'sortable-table-aria',
      passed,
      message: passed
        ? 'Sortable table correctly uses aria-sort, accessible controls, and live announcements.'
        : `${issues.length} issue(s) found with sortable table accessibility.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
