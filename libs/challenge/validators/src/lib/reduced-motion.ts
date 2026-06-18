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
          // Check that the media query contains a rule block with a selector that disables animations
          // Pattern: selector { ... animation: none ... } inside the media query
          if (
            /prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[^}]*\{[^}]*(animation\s*:\s*none|animation-duration\s*:\s*0|transition-duration\s*:\s*0|animation-play-state\s*:\s*paused)/i.test(
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

  const rules = Array.from(sheet.cssRules || []);
  for (const rule of rules) {
    if (rule instanceof CSSMediaRule) {
      if (/prefers-reduced-motion\s*:\s*reduce/i.test(rule.conditionText)) {
        hasQuery = true;
        // Check that at least one CSSStyleRule inside the media query disables animations
        disablesAnimations = hasAnimationDisablingStyleRule(rule);
      }
    }
  }

  return { hasQuery, disablesAnimations };
}

/**
 * Checks whether a CSSMediaRule contains at least one CSSStyleRule (with a selector)
 * that disables animations. A bare `animation: none` without a selector is invalid CSS
 * and should not pass validation.
 */
function hasAnimationDisablingStyleRule(mediaRule: CSSMediaRule): boolean {
  const animationPattern =
    /animation\s*:\s*none|animation-duration\s*:\s*0|transition-duration\s*:\s*0|animation-play-state\s*:\s*paused/i;

  for (const innerRule of Array.from(mediaRule.cssRules || [])) {
    if (innerRule instanceof CSSStyleRule) {
      if (animationPattern.test(innerRule.style.cssText)) {
        return true;
      }
    }
  }
  return false;
}
