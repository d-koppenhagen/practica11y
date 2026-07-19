import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that the CSS includes a prefers-color-scheme: dark media query
 * with appropriate background and color rules.
 *
 * Users who prefer dark mode should receive adapted color schemes.
 * This validator checks that:
 * 1. A @media (prefers-color-scheme: dark) rule exists in the CSS
 * 2. Inside that rule, background-color/background AND color properties are set
 */
export const prefersColorScheme: Validator = {
  id: 'prefers-color-scheme',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const issues: string[] = [];

    let hasColorSchemeQuery = false;
    let hasBackgroundRule = false;
    let hasColorRule = false;

    // Check inline <style> elements and linked stylesheets
    const styleSheets = Array.from(document.styleSheets || []);
    for (const sheet of styleSheets) {
      try {
        const result = checkStyleSheet(sheet);
        if (result.hasQuery) hasColorSchemeQuery = true;
        if (result.hasBackground) hasBackgroundRule = true;
        if (result.hasColor) hasColorRule = true;
      } catch {
        // Cross-origin stylesheets may throw — skip them
      }
    }

    // Also check source CSS if available via analysis context (inline <style> fallback)
    if (!hasColorSchemeQuery && analysisResult?.sourceHtml) {
      const inlineStyles = Array.from(document.querySelectorAll('style'));
      for (const style of inlineStyles) {
        const cssText = style.textContent || '';
        if (/prefers-color-scheme\s*:\s*dark/i.test(cssText)) {
          hasColorSchemeQuery = true;
          // Check for background and color properties inside the media query block
          const mediaBlockMatch = cssText.match(
            /prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*?)\}\s*\}/i,
          );
          if (mediaBlockMatch) {
            const blockContent = mediaBlockMatch[1];
            if (/background(-color)?\s*:/i.test(blockContent)) {
              hasBackgroundRule = true;
            }
            if (/(?<!background-)color\s*:/i.test(blockContent)) {
              hasColorRule = true;
            }
          }
        }
      }
    }

    if (!hasColorSchemeQuery) {
      issues.push(
        'No @media (prefers-color-scheme: dark) query found. Add this media query to provide a dark color scheme for users who prefer it.',
      );
    } else {
      if (!hasBackgroundRule) {
        issues.push(
          '@media (prefers-color-scheme: dark) exists but does not adjust background-color or background. Add a background rule inside the query to adapt the theme.',
        );
      }
      if (!hasColorRule) {
        issues.push(
          '@media (prefers-color-scheme: dark) exists but does not adjust the text color. Add a color rule inside the query to ensure text remains legible on the dark background.',
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'prefers-color-scheme',
      passed,
      message: passed
        ? 'Dark mode is properly supported via prefers-color-scheme media query.'
        : 'Missing or incomplete prefers-color-scheme: dark support.',
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

function checkStyleSheet(sheet: CSSStyleSheet): {
  hasQuery: boolean;
  hasBackground: boolean;
  hasColor: boolean;
} {
  let hasQuery = false;
  let hasBackground = false;
  let hasColor = false;

  traverseRules(Array.from(sheet.cssRules || []), (rule) => {
    if (rule instanceof CSSMediaRule) {
      if (/prefers-color-scheme\s*:\s*dark/i.test(rule.conditionText)) {
        hasQuery = true;
        const result = checkMediaRuleContents(rule);
        if (result.hasBackground) hasBackground = true;
        if (result.hasColor) hasColor = true;
      }
    }
  });

  return { hasQuery, hasBackground, hasColor };
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
 * Checks whether a CSSMediaRule contains style rules with background and color properties.
 */
function checkMediaRuleContents(mediaRule: CSSMediaRule): {
  hasBackground: boolean;
  hasColor: boolean;
} {
  let hasBackground = false;
  let hasColor = false;

  for (const innerRule of Array.from(mediaRule.cssRules || [])) {
    if (innerRule instanceof CSSStyleRule) {
      const cssText = innerRule.style.cssText;
      if (/background(-color)?\s*:/i.test(cssText)) {
        hasBackground = true;
      }
      if (/(?<!background-)color\s*:/i.test(cssText)) {
        hasColor = true;
      }
      // Check nested rules within this style rule (deeper nesting)
      if (innerRule.cssRules?.length) {
        for (const nestedRule of Array.from(innerRule.cssRules)) {
          if (nestedRule instanceof CSSStyleRule) {
            const nestedCssText = nestedRule.style.cssText;
            if (/background(-color)?\s*:/i.test(nestedCssText)) {
              hasBackground = true;
            }
            if (/(?<!background-)color\s*:/i.test(nestedCssText)) {
              hasColor = true;
            }
          }
        }
      }
    }
  }

  return { hasBackground, hasColor };
}
