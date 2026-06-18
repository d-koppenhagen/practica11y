import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that a skip link is present and correctly implemented:
 * 1. An anchor link pointing to an in-page target (href="#...")
 * 2. The target element exists in the document
 * 3. The skip link is among the first focusable elements on the page
 */
export const hasSkipLink: Validator = {
  id: 'has-skip-link',

  validate(document: Document): ValidationResult {
    // Find all anchor links with in-page targets
    const links = Array.from(document.querySelectorAll('a[href^="#"]'));

    // Look for a skip link: an anchor with href="#<id>" where the target exists
    // and the link appears early in the DOM (before or within the first landmark)
    const skipLink = links.find((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return false;

      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return false;

      // Check that the target is the main content area or inside it
      const isMainContent =
        target.tagName === 'MAIN' ||
        target.closest('main') !== null ||
        target.querySelector('main') !== null ||
        target.getAttribute('role') === 'main';

      return isMainContent;
    });

    if (!skipLink) {
      return {
        validatorId: 'has-skip-link',
        passed: false,
        message:
          'No skip link found. Add an anchor link (e.g. <a href="#main-content">) that targets the main content area.',
      };
    }

    // Verify the skip link is among the first focusable elements
    const focusableSelector =
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const allFocusable = Array.from(
      document.querySelectorAll(focusableSelector),
    );
    const skipLinkIndex = allFocusable.indexOf(skipLink);

    if (skipLinkIndex > 2) {
      return {
        validatorId: 'has-skip-link',
        passed: false,
        message:
          'Skip link found but it is not among the first focusable elements. Move it to the top of the page.',
        details: `Skip link is at focusable position ${skipLinkIndex + 1}.`,
      };
    }

    return {
      validatorId: 'has-skip-link',
      passed: true,
      message: 'Skip link correctly implemented.',
      details: `Links to "${skipLink.getAttribute('href')}" and is at focusable position ${skipLinkIndex + 1}.`,
    };
  },
};
