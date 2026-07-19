import type { SimulationPreferences } from './build-simulation-css';

/**
 * Extracts CSS rules from @media blocks that match the current simulation preferences.
 * Returns the inner rules without the media query wrapper, so they apply unconditionally.
 *
 * This is necessary because setting `color-scheme: dark` in CSS does NOT trigger
 * `@media (prefers-color-scheme: dark)` queries — those only respond to the actual
 * OS/browser preference. To simulate the preference, we extract the rules and apply
 * them directly.
 */
export function extractSimulatedMediaRules(
  css: string,
  prefs: SimulationPreferences,
): string {
  const blocks: string[] = [];

  if (prefs.colorScheme === 'dark') {
    blocks.push(
      ...extractMediaQueryRules(css, /prefers-color-scheme\s*:\s*dark/i),
    );
  }

  if (prefs.reducedMotion === 'reduce') {
    blocks.push(
      ...extractMediaQueryRules(css, /prefers-reduced-motion\s*:\s*reduce/i),
    );
  }

  if (prefs.contrast === 'more') {
    blocks.push(...extractMediaQueryRules(css, /prefers-contrast\s*:\s*more/i));
  } else if (prefs.contrast === 'less') {
    blocks.push(...extractMediaQueryRules(css, /prefers-contrast\s*:\s*less/i));
  } else if (prefs.contrast === 'custom') {
    blocks.push(
      ...extractMediaQueryRules(css, /prefers-contrast\s*:\s*custom/i),
    );
  }

  return blocks.join('\n');
}

/**
 * Finds all @media blocks matching the given condition pattern and returns
 * their inner content (the rules without the @media wrapper).
 *
 * Uses brace-counting to handle nested braces correctly.
 */
function extractMediaQueryRules(
  css: string,
  conditionPattern: RegExp,
): string[] {
  const results: string[] = [];
  const mediaRegex = /@media\s*\([^)]*\)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = mediaRegex.exec(css)) !== null) {
    const conditionPart = match[0];
    if (!conditionPattern.test(conditionPart)) continue;

    // Found a matching @media block — extract its content using brace counting
    const startBrace = match.index + match[0].length;
    let depth = 1;
    let i = startBrace;

    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }

    if (depth === 0) {
      const innerContent = css.slice(startBrace, i - 1).trim();
      if (innerContent) {
        results.push(innerContent);
      }
    }
  }

  return results;
}
