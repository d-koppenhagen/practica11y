import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that the CSS respects the prefers-contrast media query.
 *
 * WCAG 1.4.11 requires sufficient contrast for non-text content.
 * Users who need high contrast can set their system preference to "more".
 *
 * This validator checks that:
 * 1. A @media (prefers-contrast: more) rule exists in the CSS
 * 2. Inside that rule, border, box-shadow, or outline rules are present
 */
export const prefersContrast: Validator = {
  id: 'prefers-contrast',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const issues: string[] = [];

    let hasContrastQuery = false;
    let hasContrastRules = false;

    // Check inline <style> elements and linked stylesheets
    const styleSheets = Array.from(document.styleSheets || []);
    for (const sheet of styleSheets) {
      try {
        const result = checkStyleSheet(sheet);
        if (result.hasQuery) hasContrastQuery = true;
        if (result.hasContrastRules) hasContrastRules = true;
      } catch {
        // Cross-origin stylesheets may throw — skip them
      }
    }

    // Also check source CSS if available via analysis context
    if (!hasContrastQuery && analysisResult?.sourceHtml) {
      const inlineStyles = Array.from(document.querySelectorAll('style'));
      for (const style of inlineStyles) {
        const cssText = style.textContent || '';
        if (/prefers-contrast\s*:\s*more/i.test(cssText)) {
          hasContrastQuery = true;
          // Check for contrast-enhancing patterns following the media query
          if (
            /prefers-contrast\s*:\s*more\s*\)\s*\{[^}]*(border|box-shadow|outline)/i.test(
              cssText,
            )
          ) {
            hasContrastRules = true;
          }
        }
      }
    }

    if (!hasContrastQuery) {
      issues.push(
        'No @media (prefers-contrast: more) query found. Add this media query to enhance borders, outlines, or remove decorative shadows for users who prefer increased contrast.',
      );
    } else if (!hasContrastRules) {
      issues.push(
        '@media (prefers-contrast: more) exists but does not appear to adjust borders, box-shadows, or outlines. Add rules that strengthen borders, add outlines, or remove decorative box-shadows inside the query.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'prefers-contrast',
      passed,
      message: passed
        ? 'High contrast styles are properly applied when prefers-contrast: more is active.'
        : 'Missing or incomplete prefers-contrast support.',
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

function checkStyleSheet(sheet: CSSStyleSheet): {
  hasQuery: boolean;
  hasContrastRules: boolean;
} {
  let hasQuery = false;
  let hasContrastRules = false;

  traverseRules(Array.from(sheet.cssRules || []), (rule) => {
    if (rule instanceof CSSMediaRule) {
      if (/prefers-contrast\s*:\s*more/i.test(rule.conditionText)) {
        hasQuery = true;
        if (hasContrastEnhancingStyleRule(rule)) {
          hasContrastRules = true;
        }
      }
    }
  });

  return { hasQuery, hasContrastRules };
}

/**
 * Recursively traverses CSS rules, including those nested inside CSSStyleRule
 * (CSS Nesting) and CSSGroupingRules (e.g., @supports, @layer).
 */
function traverseRules(
  rules: CSSRule[],
  callback: (rule: CSSRule) => void,
): void {
  for (const rule of rules) {
    callback(rule);

    // CSSStyleRule can contain nested rules when CSS Nesting is used
    if (rule instanceof CSSStyleRule && rule.cssRules?.length) {
      traverseRules(Array.from(rule.cssRules), callback);
    }

    // CSSGroupingRule covers @supports, @layer, and other grouping rules
    // (but NOT CSSMediaRule which we handle via callback above)
    if (
      rule instanceof CSSGroupingRule &&
      !(rule instanceof CSSMediaRule) &&
      rule.cssRules?.length
    ) {
      traverseRules(Array.from(rule.cssRules), callback);
    }

    // Also recurse into CSSMediaRule children to find nested @media inside @media
    if (rule instanceof CSSMediaRule && rule.cssRules?.length) {
      traverseRules(Array.from(rule.cssRules), callback);
    }
  }
}

/**
 * Checks whether a CSSMediaRule contains at least one CSSStyleRule
 * that adjusts border, box-shadow, or outline properties.
 */
function hasContrastEnhancingStyleRule(mediaRule: CSSMediaRule): boolean {
  const contrastPattern = /\bborder\b|box-shadow|outline/i;

  for (const innerRule of Array.from(mediaRule.cssRules || [])) {
    if (innerRule instanceof CSSStyleRule) {
      if (contrastPattern.test(innerRule.style.cssText)) {
        return true;
      }
      // Check nested rules within this style rule (deeper nesting)
      if (innerRule.cssRules?.length) {
        for (const nestedRule of Array.from(innerRule.cssRules)) {
          if (
            nestedRule instanceof CSSStyleRule &&
            contrastPattern.test(nestedRule.style.cssText)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
