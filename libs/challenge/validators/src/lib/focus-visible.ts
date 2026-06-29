import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that interactive elements have visible focus indicators.
 * Checks the CSS source for rules that remove focus outlines (outline: none, outline: 0)
 * without providing alternative focus styles via :focus-visible.
 */
export const focusVisible: Validator = {
  id: 'focus-visible',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';

    // Extract inline <style> blocks and style attributes from the source HTML
    const styleBlocks = extractStyleBlocks(sourceHtml);

    // Also check any <style> elements in the document
    const docStyles = Array.from(_document.querySelectorAll('style'))
      .map((el) => el.textContent ?? '')
      .join('\n');

    const allCss = [...styleBlocks, docStyles].join('\n');

    // Detect rules that remove focus indicators
    const removesOutline = detectFocusRemoval(allCss);

    if (!removesOutline) {
      return {
        validatorId: 'focus-visible',
        passed: true,
        message:
          'Focus indicators are preserved. Interactive elements remain visible when focused.',
      };
    }

    // Check if there are replacement focus-visible styles
    const hasFocusVisibleReplacement = detectFocusVisibleStyles(allCss);

    const passed = hasFocusVisibleReplacement;

    return {
      validatorId: 'focus-visible',
      passed,
      message: passed
        ? 'Focus indicators are properly implemented with :focus-visible styles.'
        : 'Focus outlines are removed without providing alternative visible focus indicators. Use :focus-visible to add custom focus styles.',
    };
  },
};

/**
 * Extracts CSS content from <style> blocks in the HTML source.
 */
function extractStyleBlocks(html: string): string[] {
  const blocks: string[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Detects if CSS rules remove focus indicators globally.
 * Looks for patterns like:
 *   outline: none
 *   outline: 0
 *   *:focus { outline: 0 }
 */
function detectFocusRemoval(css: string): boolean {
  // Normalize whitespace
  const normalized = css.replace(/\s+/g, ' ');

  // Check for outline removal in focus-related or wildcard rules
  const outlineRemovalPatterns = [
    /\*\s*\{[^}]*outline\s*:\s*(none|0)\s*;?/i,
    /\*:focus\s*\{[^}]*outline\s*:\s*(none|0)\s*;?/i,
    /:focus\s*\{[^}]*outline\s*:\s*(none|0)\s*;?/i,
  ];

  return outlineRemovalPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Detects if CSS includes :focus-visible styles as a replacement
 * for removed focus outlines.
 */
function detectFocusVisibleStyles(css: string): boolean {
  // Check for :focus-visible rules with outline or box-shadow
  const focusVisiblePattern =
    /:focus-visible\s*\{[^}]*(outline|box-shadow)\s*:/i;
  return focusVisiblePattern.test(css);
}
