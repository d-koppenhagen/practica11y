import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that CSS includes scroll-padding or scroll-margin properties
 * to prevent focused elements from being obscured by fixed/sticky overlays.
 *
 * Checks for:
 * 1. scroll-padding-top or scroll-padding (to account for sticky headers)
 * 2. scroll-padding-bottom or scroll-margin-bottom (to account for fixed footers)
 * 3. Use of :focus-visible instead of :focus for focus indicator styles
 */
export const focusNotObscured: Validator = {
  id: 'focus-not-obscured',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';

    // Extract CSS from <style> blocks and inline styles
    const allCss = extractAllCss(sourceHtml, _document);

    const issues: string[] = [];

    // Check for scroll-padding-top or scroll-padding to handle sticky header
    const hasScrollPaddingTop =
      /scroll-padding-top\s*:/i.test(allCss) ||
      /scroll-padding\s*:[^;]*\b(?!0)/i.test(allCss);

    if (!hasScrollPaddingTop) {
      const hasScrollMarginTop = /scroll-margin-top\s*:/i.test(allCss);
      if (!hasScrollMarginTop) {
        issues.push(
          'No scroll-padding-top or scroll-margin-top found. Focused elements may be hidden behind the sticky header.',
        );
      }
    }

    // Check for scroll-padding-bottom or scroll-margin-bottom to handle fixed footer
    const hasScrollPaddingBottom =
      /scroll-padding-bottom\s*:/i.test(allCss) ||
      /scroll-padding\s*:[^;]*\b\d/i.test(allCss);

    if (!hasScrollPaddingBottom) {
      const hasScrollMarginBottom = /scroll-margin-bottom\s*:/i.test(allCss);
      if (!hasScrollMarginBottom) {
        issues.push(
          'No scroll-padding-bottom or scroll-margin-bottom found. Focused elements may be hidden behind the fixed cookie banner.',
        );
      }
    }

    // Check that :focus-visible is used instead of bare :focus
    const hasFocusVisible = /:focus-visible/i.test(allCss);
    const hasBareOnlyFocus = hasBareOnlyFocusSelector(allCss);

    if (!hasFocusVisible) {
      issues.push(
        'No :focus-visible selector found. Use :focus-visible instead of :focus to show focus indicators only for keyboard users.',
      );
    } else if (hasBareOnlyFocus) {
      issues.push(
        'Found bare :focus selector without :focus-visible. Replace :focus with :focus-visible for keyboard-only focus indicators.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'focus-not-obscured',
      passed,
      message: passed
        ? 'Focus obscuration is prevented. Scroll padding/margin ensures focused elements remain visible behind fixed overlays.'
        : `${issues.length} issue(s) found that may cause focused elements to be obscured.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Extracts all CSS content from style blocks in HTML source and document.
 */
function extractAllCss(sourceHtml: string, doc: Document): string {
  const blocks: string[] = [];

  // From source HTML
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(sourceHtml)) !== null) {
    blocks.push(match[1]);
  }

  // From document
  const docStyles = Array.from(doc.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .join('\n');
  blocks.push(docStyles);

  return blocks.join('\n');
}

/**
 * Checks if there are bare :focus selectors (not :focus-visible or :focus-within)
 * that define outline styles. These should be replaced with :focus-visible.
 */
function hasBareOnlyFocusSelector(css: string): boolean {
  // Match :focus that is NOT followed by -visible or -within
  const bareFocusPattern = /:focus(?!-visible|-within)\s*[,{]/i;
  return bareFocusPattern.test(css);
}
