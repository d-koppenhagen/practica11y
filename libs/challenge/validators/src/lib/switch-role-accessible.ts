import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that toggle/switch controls implement the ARIA switch pattern correctly:
 * - Each toggle must use a <button> element (not a <div> or <span>)
 * - Each toggle must have role="switch"
 * - Each toggle must have aria-checked="true" or aria-checked="false"
 * - Each toggle must have an accessible name (aria-labelledby, aria-label, or visible text)
 */
export const switchRoleAccessible: Validator = {
  id: 'switch-role-accessible',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Look for elements that look like toggles (class-based detection)
    const toggleElements = document.querySelectorAll('.toggle');

    if (toggleElements.length === 0) {
      return {
        validatorId: 'switch-role-accessible',
        passed: false,
        message:
          'No toggle elements found (elements with class "toggle"). The page must contain toggle switches.',
      };
    }

    for (let i = 0; i < toggleElements.length; i++) {
      const toggle = toggleElements[i];
      const index = i + 1;
      const tag = toggle.tagName.toLowerCase();

      // 1. Must be a <button> element
      if (tag !== 'button') {
        issues.push(
          `Toggle #${index}: uses a <${tag}> element. Use a <button> for native keyboard support and focusability.`,
        );
      }

      // 2. Must have role="switch"
      const role = toggle.getAttribute('role');
      if (role !== 'switch') {
        issues.push(
          `Toggle #${index}: missing \`role="switch"\`. Add role="switch" to communicate the toggle pattern to assistive technology.`,
        );
      }

      // 3. Must have aria-checked
      const ariaChecked = toggle.getAttribute('aria-checked');
      if (ariaChecked === null) {
        issues.push(
          `Toggle #${index}: missing \`aria-checked\`. Add aria-checked="true" or aria-checked="false" to expose the current state.`,
        );
      } else if (ariaChecked !== 'true' && ariaChecked !== 'false') {
        issues.push(
          `Toggle #${index}: \`aria-checked="${ariaChecked}"\` is not a valid value. Use "true" or "false".`,
        );
      }

      // 4. Must have an accessible name
      const ariaLabel = toggle.getAttribute('aria-label');
      const ariaLabelledby = toggle.getAttribute('aria-labelledby');
      const textContent = (toggle.textContent ?? '').trim();

      let hasAccessibleName = false;

      if (ariaLabelledby) {
        // Check that the referenced element exists and has text
        const ids = ariaLabelledby.split(/\s+/);
        const labelText = ids
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ');
        hasAccessibleName = labelText.length > 0;
      } else if (ariaLabel && ariaLabel.trim().length > 0) {
        hasAccessibleName = true;
      } else if (textContent.length > 0) {
        hasAccessibleName = true;
      }

      if (!hasAccessibleName) {
        issues.push(
          `Toggle #${index}: has no accessible name. Use \`aria-labelledby\` to reference a label, \`aria-label\`, or provide visible text content.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'switch-role-accessible',
      passed,
      message: passed
        ? 'All toggle switches implement the ARIA switch pattern correctly.'
        : `${issues.length} accessibility issue(s) found in toggle switches.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
