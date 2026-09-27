import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that the page announces dynamic updates to screen readers using
 * one of two accepted patterns:
 *
 * 1. **Persistent live region** (classic ARIA pattern)
 *    Screen readers only announce changes to live regions that already exist
 *    in the DOM. Creating an element and setting aria-live at the same time
 *    means the announcement will be missed. The correct pattern is:
 *    - A persistent element with aria-live exists in the HTML from the start
 *    - Content is updated by changing textContent of the existing region
 *
 * 2. **ariaNotify() API** (modern alternative, Baseline since 09/2026)
 *    `element.ariaNotify()` / `document.ariaNotify()` triggers a screen reader
 *    announcement directly from JavaScript, without needing a persistent live
 *    region in the DOM. This is a valid, more robust solution to the same
 *    problem, so it is accepted here as an equivalent alternative.
 *    See https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify
 *
 * When the ariaNotify() approach is detected, the persistent-live-region checks
 * are skipped, because that pattern deliberately does not rely on a live region.
 */
export const liveRegionPattern: Validator = {
  id: 'live-region-pattern',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';

    // Gather script content from the rendered document. The user's JS is
    // injected into the sandbox as a <script> tag, so ariaNotify() calls show
    // up here. Fall back to sourceHtml for environments where the script text
    // is only available in the raw source.
    const domScriptContent = Array.from(document.querySelectorAll('script'))
      .map((script) => script.textContent ?? '')
      .join('\n');
    const scriptContent = `${domScriptContent}\n${sourceHtml}`;

    // Accept the modern ariaNotify() API as an equivalent solution. It matches
    // `foo.ariaNotify(`, `ariaNotify (`, `document.ariaNotify(`, etc.
    const usesAriaNotify = /\bariaNotify\s*\(/.test(scriptContent);
    if (usesAriaNotify) {
      return {
        validatorId: 'live-region-pattern',
        passed: true,
        message:
          'Announcements are made using the ariaNotify() API, a valid modern alternative to a persistent live region.',
      };
    }

    const issues: string[] = [];

    // Check if there's a live region in the rendered DOM
    const liveRegions = Array.from(
      document.querySelectorAll(
        '[aria-live="polite"], [aria-live="assertive"], [role="alert"], [role="status"]',
      ),
    );

    if (liveRegions.length === 0) {
      issues.push(
        'No live region found. Add an element with aria-live="polite" (or role="status") that exists in the HTML before content changes, or use the ariaNotify() API.',
      );
    }

    // Check if the live region exists in the source HTML (not just dynamically created)
    if (sourceHtml) {
      const hasLiveRegionInSource =
        /aria-live\s*=\s*["'](polite|assertive)["']/i.test(sourceHtml) ||
        /role\s*=\s*["'](alert|status)["']/i.test(sourceHtml);

      if (!hasLiveRegionInSource) {
        issues.push(
          'No persistent live region found in the HTML source. The live region must exist in the static HTML before dynamic content is inserted (or use the ariaNotify() API instead).',
        );
      }
    }

    // Check that JS doesn't create a new element with aria-live (the anti-pattern)
    // This is a heuristic check on the source HTML — if it has createElement + aria-live
    // patterns, it's likely the broken pattern
    if (sourceHtml) {
      const createsLiveRegionDynamically =
        /createElement.*aria-live|setAttribute\s*\(\s*['"]aria-live['"]/i.test(
          sourceHtml,
        );

      if (createsLiveRegionDynamically) {
        issues.push(
          'Live region appears to be created dynamically in JavaScript. The live region element must already exist in the HTML — only update its content.',
        );
      }
    }
    const passed = issues.length === 0;

    return {
      validatorId: 'live-region-pattern',
      passed,
      message: passed
        ? 'Live region pattern is correctly implemented with a persistent region in the HTML.'
        : `${issues.length} issue(s) with the live region pattern.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
