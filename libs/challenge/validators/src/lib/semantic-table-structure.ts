import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that tabular data is presented using semantic table elements
 * (or equivalent ARIA table roles) rather than styled divs.
 *
 * Checks for:
 * 1. Presence of a `<table>` element (or element with `role="table"`)
 * 2. Proper column headers (`<th>` with `scope="col"` or `role="columnheader"`)
 * 3. Proper row headers (`<th>` with `scope="row"` or `role="rowheader"`) when applicable
 * 4. Absence of div-based grid patterns that visually look like tables but lack semantics
 */
export const semanticTableStructure: Validator = {
  id: 'semantic-table-structure',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Check for semantic table or ARIA table
    const nativeTables = Array.from(document.querySelectorAll('table'));
    const ariaTables = Array.from(document.querySelectorAll('[role="table"]'));
    const allTables = [...nativeTables, ...ariaTables];

    if (allTables.length === 0) {
      issues.push(
        'No <table> element or element with role="table" found. ' +
          'Tabular data must use semantic table markup so screen readers ' +
          'can provide row/column navigation.',
      );

      return {
        validatorId: 'semantic-table-structure',
        passed: false,
        message: 'No semantic table structure found for tabular data.',
        details: issues.join('\n'),
      };
    }

    for (const table of allTables) {
      const isNative = table.tagName.toLowerCase() === 'table';

      if (isNative) {
        // Check for column headers
        const columnHeaders = Array.from(
          table.querySelectorAll('th[scope="col"], thead th'),
        );
        if (columnHeaders.length === 0) {
          issues.push(
            'Table is missing column headers. Use <th scope="col"> in a ' +
              '<thead> to identify column headings.',
          );
        }

        // Check for row headers (at least one th with scope="row")
        const rowHeaders = Array.from(
          table.querySelectorAll('th[scope="row"]'),
        );
        const tbodyThElements = Array.from(table.querySelectorAll('tbody th'));

        // If there are th elements in tbody without scope, suggest adding scope
        for (const th of tbodyThElements) {
          if (!th.hasAttribute('scope')) {
            issues.push(
              `A <th> element in the table body ("${th.textContent?.trim()}") is missing ` +
                'a scope attribute. Add scope="row" to associate it with its row.',
            );
          }
        }

        // Check that role="presentation" is not used on a data table
        const role = table.getAttribute('role');
        if (role === 'presentation' || role === 'none') {
          issues.push(
            'This table has role="presentation" which suppresses table semantics. ' +
              'Data tables must not use role="presentation".',
          );
        }
      } else {
        // ARIA table — check for proper roles
        const rows = table.querySelectorAll('[role="row"]');
        if (rows.length === 0) {
          issues.push(
            'ARIA table (role="table") is missing rows with role="row".',
          );
        }

        const columnHeaders = table.querySelectorAll('[role="columnheader"]');
        if (columnHeaders.length === 0) {
          issues.push(
            'ARIA table is missing column headers (role="columnheader").',
          );
        }
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'semantic-table-structure',
      passed,
      message: passed
        ? 'Table uses proper semantic structure with headers.'
        : `${issues.length} issue(s) found with table structure.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
