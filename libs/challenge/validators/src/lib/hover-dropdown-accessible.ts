import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that a dropdown menu is keyboard-accessible and properly announced:
 * - The trigger must be a <button> (not a span/div)
 * - The trigger must have aria-expanded
 * - The trigger must have aria-haspopup="true"
 * - The menu must have role="menu"
 * - Menu items must have role="menuitem"
 */
export const hoverDropdownAccessible: Validator = {
  id: 'hover-dropdown-accessible',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // 1. Check that the trigger is a <button>
    const trigger = document.querySelector('.dropdown-trigger');
    if (!trigger) {
      return {
        validatorId: 'hover-dropdown-accessible',
        passed: false,
        message:
          'No dropdown trigger found (element with class "dropdown-trigger").',
      };
    }

    const triggerTag = trigger.tagName.toLowerCase();
    if (triggerTag !== 'button') {
      issues.push(
        `The dropdown trigger is a <${triggerTag}> element. Use a <button> for proper keyboard support and semantics.`,
      );
    }

    // 2. Check aria-expanded on the trigger
    const ariaExpanded = trigger.getAttribute('aria-expanded');
    if (ariaExpanded === null) {
      issues.push(
        'The dropdown trigger is missing `aria-expanded`. Add aria-expanded="false" (toggled to "true" when open) so screen readers announce the menu state.',
      );
    }

    // 3. Check aria-haspopup on the trigger
    const ariaHaspopup = trigger.getAttribute('aria-haspopup');
    if (!ariaHaspopup || (ariaHaspopup !== 'true' && ariaHaspopup !== 'menu')) {
      issues.push(
        'The dropdown trigger is missing `aria-haspopup="true"`. This tells assistive technology that the button controls a popup menu.',
      );
    }

    // 4. Check that the menu has role="menu"
    const menu = document.querySelector('.dropdown-menu');
    if (!menu) {
      issues.push(
        'No dropdown menu found (element with class "dropdown-menu").',
      );
    } else {
      const menuRole = menu.getAttribute('role');
      if (menuRole !== 'menu') {
        issues.push(
          'The dropdown menu is missing `role="menu"`. Add it to communicate the menu pattern to assistive technology.',
        );
      }

      // 5. Check that menu items have role="menuitem"
      const items = menu.querySelectorAll('li a, li button, [role="menuitem"]');
      const menuItems = menu.querySelectorAll('[role="menuitem"]');

      if (items.length > 0 && menuItems.length === 0) {
        issues.push(
          'Menu items are missing `role="menuitem"`. Each item in the dropdown should have role="menuitem" for proper screen reader announcement.',
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'hover-dropdown-accessible',
      passed,
      message: passed
        ? 'The dropdown menu is keyboard-accessible and properly announced.'
        : `${issues.length} accessibility issue(s) found in the dropdown.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
