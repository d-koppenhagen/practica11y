import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that the CSS respects the prefers-reduced-motion media query.
 *
 * WCAG 2.3.3 requires that motion animation triggered by interaction
 * can be disabled. Users with vestibular disorders can be harmed by animations.
 *
 * This validator checks that:
 * 1. A @media (prefers-reduced-motion: reduce) rule exists in the CSS
 * 2. Inside that rule, animations or transitions are disabled/reduced
 */
export const reducedMotion: Validator = {
  id: 'reduced-motion',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const issues: string[] = [];

    // Check stylesheets in the document for prefers-reduced-motion
    let hasReducedMotionQuery = false;
    let disablesAnimations = false;

    // Check inline <style> elements and linked stylesheets
    const styleSheets = Array.from(document.styleSheets || []);
    for (const sheet of styleSheets) {
      try {
        const result = checkStyleSheet(sheet);
        if (result.hasQuery) hasReducedMotionQuery = true;
        if (result.disablesAnimations) disablesAnimations = true;
      } catch {
        // Cross-origin stylesheets may throw — skip them
      }
    }

    // Also check source CSS if available via analysis context
    if (!hasReducedMotionQuery && analysisResult?.sourceHtml) {
      // The sourceHtml may contain <style> tags — but we primarily want to check
      // CSS source. Let's also check the rendered styles.
      const inlineStyles = Array.from(document.querySelectorAll('style'));
      for (const style of inlineStyles) {
        const cssText = style.textContent || '';
        if (/prefers-reduced-motion\s*:\s*reduce/i.test(cssText)) {
          hasReducedMotionQuery = true;
          // Check for animation-disabling patterns following the media query.
          // Handles both top-level @media blocks and nested @media inside a selector.
          if (
            /prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[^}]*(animation\s*:\s*none|animation-duration\s*:\s*0|transition-duration\s*:\s*0|animation-play-state\s*:\s*paused)/i.test(
              cssText,
            )
          ) {
            disablesAnimations = true;
          }
        }
      }
    }

    if (!hasReducedMotionQuery) {
      issues.push(
        'No @media (prefers-reduced-motion: reduce) query found. Add this media query to disable or reduce animations for users who prefer reduced motion.',
      );
    } else if (!disablesAnimations) {
      issues.push(
        '@media (prefers-reduced-motion: reduce) exists but does not appear to disable animations. Set animation: none, animation-duration: 0.01ms, or transition-duration: 0.01ms inside the query.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'reduced-motion',
      passed,
      message: passed
        ? 'Animations are properly reduced when prefers-reduced-motion is active.'
        : 'Missing or incomplete prefers-reduced-motion support.',
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

function checkStyleSheet(sheet: CSSStyleSheet): {
  hasQuery: boolean;
  disablesAnimations: boolean;
} {
  let hasQuery = false;
  let disablesAnimations = false;

  traverseRules(Array.from(sheet.cssRules || []), (rule) => {
    if (rule instanceof CSSMediaRule) {
      if (/prefers-reduced-motion\s*:\s*reduce/i.test(rule.conditionText)) {
        hasQuery = true;
        if (hasAnimationDisablingStyleRule(rule)) {
          disablesAnimations = true;
        }
      }
    }
  });

  return { hasQuery, disablesAnimations };
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
 * Checks whether a CSSMediaRule contains at least one CSSStyleRule (with a selector)
 * that disables animations. Also handles CSS Nesting where the rule might use
 * the implicit `&` selector or be nested deeper.
 */
function hasAnimationDisablingStyleRule(mediaRule: CSSMediaRule): boolean {
  const animationPattern =
    /animation\s*:\s*none|animation-duration\s*:\s*0|transition-duration\s*:\s*0|animation-play-state\s*:\s*paused/i;

  for (const innerRule of Array.from(mediaRule.cssRules || [])) {
    if (innerRule instanceof CSSStyleRule) {
      if (animationPattern.test(innerRule.style.cssText)) {
        return true;
      }
      // Check nested rules within this style rule (deeper nesting)
      if (innerRule.cssRules?.length) {
        for (const nestedRule of Array.from(innerRule.cssRules)) {
          if (
            nestedRule instanceof CSSStyleRule &&
            animationPattern.test(nestedRule.style.cssText)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
