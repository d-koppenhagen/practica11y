import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that buttons and links are used with correct semantics:
 * - Navigation actions ("View Details", links to other pages) should be <a> with real href (not onclick navigation)
 * - In-page actions ("Add to Cart", "Delete", etc.) should be <button> (not <a href="#">)
 *
 * Checks:
 * 1. <a> elements must have a real href (not "#" or empty) and no action-only onclick
 * 2. <button> elements must not use onclick for navigation (location.href etc.)
 * 3. <a> elements with onclick navigation must become proper <a href="..."> without onclick
 * 4. <button> elements should not have href attributes (invalid HTML)
 */
export const buttonLinkSemantics: Validator = {
  id: 'button-link-semantics',

  validate(document: Document): ValidationResult {
    const errors: string[] = [];

    const buttons = Array.from(document.querySelectorAll('button'));
    const links = Array.from(document.querySelectorAll('a'));

    // --- Button checks ---
    for (const button of buttons) {
      const onclick = button.getAttribute('onclick') ?? '';
      const label = button.textContent?.trim() || '[unnamed button]';

      // Buttons navigating via onclick
      if (/location\s*[.=]/.test(onclick) || /window\.open/.test(onclick)) {
        errors.push(
          `"${label}" navigates to another page but uses <button>. Use <a href="..."> instead.`,
        );
      }

      // Buttons with href attribute (invalid HTML, likely confused with <a>)
      if (button.hasAttribute('href')) {
        errors.push(
          `"${label}" is a <button> with an href attribute. Use <a href="..."> for navigation or remove href for actions.`,
        );
      }
    }

    // --- Link checks ---
    for (const link of links) {
      const href = link.getAttribute('href');
      const onclick = link.getAttribute('onclick') ?? '';
      const label = link.textContent?.trim() || '[unnamed link]';

      // Links without href or with empty/hash href that have action onclick
      const hasRealHref =
        href !== null &&
        href !== '' &&
        href !== '#' &&
        !href.startsWith('javascript:');
      const hasNavigationOnclick =
        /location\s*[.=]/.test(onclick) || /window\.open/.test(onclick);
      const hasActionOnclick = onclick.length > 0 && !hasNavigationOnclick;

      // <a> with onclick for navigation but no real href
      if (hasNavigationOnclick && !hasRealHref) {
        errors.push(
          `"${label}" uses <a> with onclick navigation. Use a proper href attribute instead of onclick.`,
        );
      }

      // <a> used for actions (href="#" + action onclick, or javascript: href)
      if (!hasRealHref && hasActionOnclick) {
        errors.push(
          `"${label}" performs an action but uses <a>. Use <button> instead.`,
        );
      }

      // <a> with no href at all (not a proper link)
      if (href === null && !hasActionOnclick && !hasNavigationOnclick) {
        errors.push(
          `"${label}" is an <a> without href. Add a valid href for navigation or use <button> for actions.`,
        );
      }
    }

    const passed = errors.length === 0;

    return {
      validatorId: 'button-link-semantics',
      passed,
      message: passed
        ? 'Buttons and links are used with correct semantics.'
        : `${errors.length} semantic issue(s) found with button/link usage.`,
      details: passed ? undefined : errors.join('\n'),
    };
  },
};
