import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that skeleton loader placeholders are properly hidden from assistive technology.
 *
 * Checks:
 * 1. Skeleton elements have aria-hidden="true" so screen readers skip them
 * 2. The container holding skeletons uses aria-busy="true" to signal loading state
 * 3. A live region (role="status" or aria-live) announces the loading state
 */
export const skeletonAriaHidden: Validator = {
  id: 'skeleton-aria-hidden',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // Find skeleton elements (elements with class names containing "skeleton")
    const skeletonElements = Array.from(
      document.querySelectorAll(
        '[class*="skeleton"]:not([class*="skeleton-card"])',
      ),
    );
    const skeletonCards = Array.from(
      document.querySelectorAll('[class*="skeleton-card"]'),
    );

    // Determine which elements to check for aria-hidden
    // If skeleton cards exist, they should have aria-hidden (hides all children too)
    // Otherwise check individual skeleton elements
    const elementsToCheck =
      skeletonCards.length > 0 ? skeletonCards : skeletonElements;

    if (elementsToCheck.length === 0) {
      // No skeletons found — might be a valid state if content loaded
      return {
        validatorId: 'skeleton-aria-hidden',
        passed: true,
        message: 'No skeleton elements found to validate.',
      };
    }

    // Check 1: Skeleton elements have aria-hidden="true"
    const unhiddenSkeletons = elementsToCheck.filter(
      (el) => el.getAttribute('aria-hidden') !== 'true',
    );

    if (unhiddenSkeletons.length > 0) {
      issues.push(
        `${unhiddenSkeletons.length} skeleton element(s) are missing aria-hidden="true". ` +
          'Decorative placeholders must be hidden from the accessibility tree.',
      );
    }

    // Check 2: Container has aria-busy="true"
    // Look for the parent container of skeletons
    const skeletonParents = new Set(
      elementsToCheck.map((el) => el.parentElement).filter(Boolean),
    );
    const busyContainers = Array.from(skeletonParents).filter(
      (parent) => parent?.getAttribute('aria-busy') === 'true',
    );

    if (busyContainers.length === 0) {
      // Also check ancestors up to 3 levels
      let foundBusy = false;
      for (const el of elementsToCheck) {
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
          if (parent.getAttribute('aria-busy') === 'true') {
            foundBusy = true;
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
        if (foundBusy) break;
      }

      if (!foundBusy) {
        issues.push(
          'The container holding skeleton loaders is missing aria-busy="true". ' +
            'This attribute signals to assistive technology that the region is still loading.',
        );
      }
    }

    // Check 3: A live region announces the loading state
    const liveRegions = Array.from(
      document.querySelectorAll(
        '[role="status"], [role="alert"], [aria-live="polite"], [aria-live="assertive"]',
      ),
    );

    if (liveRegions.length === 0) {
      issues.push(
        'No live region found to announce the loading state. ' +
          'Add an element with role="status" (or aria-live="polite") that communicates the loading state to screen reader users.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'skeleton-aria-hidden',
      passed,
      message: passed
        ? 'Skeleton loaders are properly hidden and loading state is communicated to assistive technology.'
        : `${issues.length} issue(s) found with skeleton loader accessibility.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
