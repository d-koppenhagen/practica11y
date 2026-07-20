import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that the page does not contain unnecessary or incorrect ARIA usage:
 *
 * 1. Redundant aria-label that just repeats the element's implicit role name
 *    (e.g. `<section aria-label="Section">`)
 * 2. Incorrect `role` attributes applied outside a valid context
 *    (e.g. `role="menuitem"` on a button not inside a menu)
 * 3. `aria-controls` referencing an ID that does not exist in the DOM
 *
 * Enforces the First Rule of ARIA: "If you can use a native HTML element with
 * the semantics you require already built in, do that instead."
 */
export const ariaOverload: Validator = {
  id: 'aria-overload',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    checkRedundantAriaLabels(document, issues);
    checkIncorrectRoles(document, issues);
    checkBrokenAriaControls(document, issues);

    const passed = issues.length === 0;

    return {
      validatorId: 'aria-overload',
      passed,
      message: passed
        ? 'No unnecessary or incorrect ARIA usage detected.'
        : `${issues.length} ARIA issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Maps HTML element tag names to their implicit ARIA role names.
 * Used to detect aria-labels that merely restate the role.
 */
const IMPLICIT_ROLE_NAMES: Record<string, string[]> = {
  section: ['section'],
  nav: ['navigation', 'nav'],
  main: ['main'],
  aside: ['complementary', 'aside'],
  header: ['banner', 'header'],
  footer: ['contentinfo', 'footer'],
  article: ['article'],
  form: ['form'],
  blockquote: ['blockquote', 'quote'],
  button: ['button'],
  table: ['table'],
  img: ['image', 'img'],
};

/**
 * Checks for aria-label values that simply restate the element's implicit role.
 */
function checkRedundantAriaLabels(document: Document, issues: string[]): void {
  const elementsWithLabel = document.querySelectorAll('[aria-label]');

  for (const element of elementsWithLabel) {
    const tagName = element.tagName.toLowerCase();
    const roleNames = IMPLICIT_ROLE_NAMES[tagName];
    if (!roleNames) continue;

    const ariaLabel = (element.getAttribute('aria-label') ?? '')
      .trim()
      .toLowerCase();
    if (!ariaLabel) continue;

    if (roleNames.includes(ariaLabel)) {
      issues.push(
        `<${tagName} aria-label="${element.getAttribute('aria-label')}"> has a label that merely repeats ` +
          `the element's implicit role. Either provide a descriptive label or remove it.`,
      );
    }
  }
}

/**
 * Roles that require a specific parent context to be valid.
 */
const CONTEXT_DEPENDENT_ROLES: Record<string, string[]> = {
  menuitem: ['[role="menu"]', '[role="menubar"]'],
  menuitemcheckbox: ['[role="menu"]', '[role="menubar"]'],
  menuitemradio: ['[role="menu"]', '[role="menubar"]'],
  option: ['[role="listbox"]', 'select', 'datalist'],
  tab: ['[role="tablist"]'],
  treeitem: ['[role="tree"]', '[role="group"]'],
  row: [
    '[role="grid"]',
    '[role="rowgroup"]',
    '[role="table"]',
    '[role="treegrid"]',
    'table',
    'thead',
    'tbody',
    'tfoot',
  ],
  cell: ['[role="row"]', 'tr'],
  gridcell: ['[role="row"]', 'tr'],
  columnheader: ['[role="row"]', 'tr'],
  rowheader: ['[role="row"]', 'tr'],
};

/**
 * Checks for role attributes that are used outside their required context.
 */
function checkIncorrectRoles(document: Document, issues: string[]): void {
  const elementsWithRole = document.querySelectorAll('[role]');

  for (const element of elementsWithRole) {
    const role = (element.getAttribute('role') ?? '').trim().toLowerCase();
    const requiredParents = CONTEXT_DEPENDENT_ROLES[role];
    if (!requiredParents) continue;

    const hasValidParent = requiredParents.some((selector) =>
      element.closest(selector),
    );

    if (!hasValidParent) {
      const tagName = element.tagName.toLowerCase();
      issues.push(
        `<${tagName} role="${role}"> is used outside a valid parent context. ` +
          `The "${role}" role requires a parent matching one of: ${requiredParents.join(', ')}.`,
      );
    }
  }
}

/**
 * Checks for aria-controls attributes that reference IDs not present in the DOM.
 */
function checkBrokenAriaControls(document: Document, issues: string[]): void {
  const elementsWithControls = document.querySelectorAll('[aria-controls]');

  for (const element of elementsWithControls) {
    const controlsValue = (element.getAttribute('aria-controls') ?? '').trim();
    if (!controlsValue) continue;

    const ids = controlsValue.split(/\s+/);
    for (const id of ids) {
      if (!document.getElementById(id)) {
        const tagName = element.tagName.toLowerCase();
        issues.push(
          `<${tagName} aria-controls="${controlsValue}"> references ID "${id}" which does not exist in the DOM. ` +
            `Remove the aria-controls attribute or add the referenced element.`,
        );
      }
    }
  }
}
