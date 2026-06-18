import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

const APP_NAME = 'mypage';

/**
 * Pages expected in this challenge.
 */
const EXPECTED_PAGES = ['home', 'about', 'contact'] as const;

/**
 * Extracts the right-hand side value of a document.title assignment.
 * Handles: document.title = "value", document.title = 'value', document.title = `value`
 * Returns the raw string content (without outer quotes) or null if not extractable.
 */
function extractTitleValue(line: string): string | null {
  const match = line.match(/document\.title\s*=\s*(['"`])(.*?)\1/);
  if (match) return match[2];

  // Template literal with expressions: document.title = `${...} - MyPage`
  const templateMatch = line.match(/document\.title\s*=\s*`([^`]*)`/);
  if (templateMatch) return templateMatch[1];

  return null;
}

/**
 * Checks if a title value is meaningful (not empty, not just whitespace/punctuation).
 */
function isMeaningfulTitle(title: string): boolean {
  // Strip template expressions like ${...} and replace with placeholder
  const withoutExpressions = title.replace(/\$\{[^}]*\}/g, 'X');
  const stripped = withoutExpressions.replace(/[\s\-|:]/g, '');
  return stripped.length > 0;
}

/**
 * Checks if a title value contains the app name.
 * Works for static strings and template literals.
 */
function containsAppName(value: string): boolean {
  return new RegExp(APP_NAME, 'i').test(value);
}

/**
 * Validates that SPA navigation sets a unique, descriptive document.title per page.
 *
 * Requirements:
 * 1. document.title must be assigned in the navigation logic
 * 2. The assigned title must be non-empty and meaningful
 * 3. The app name "MyPage" must be part of every title
 * 4. Each page must get a distinct title (page-specific part differs)
 */
export const pageTitle: Validator = {
  id: 'page-title',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const errors: string[] = [];

    // Gather script content — prefer parsed DOM scripts, fall back to sourceHtml
    const scripts = Array.from(document.querySelectorAll('script'));
    const domScriptContent = scripts.map((s) => s.textContent ?? '').join('\n');
    const scriptContent = domScriptContent.trim()
      ? domScriptContent
      : (analysisResult?.sourceHtml ?? '');

    // --- Check 1: document.title must be assigned ---
    if (!/document\.title\s*=/.test(scriptContent)) {
      errors.push(
        'No document.title assignment found. Set document.title in your navigation logic so each page gets a descriptive title.',
      );
      return buildResult(errors);
    }

    // --- Collect all title assignment lines and their values ---
    const lines = scriptContent.split('\n');
    const titleAssignmentLines = lines.filter((line) =>
      /document\.title\s*=/.test(line),
    );
    const titleValues = titleAssignmentLines
      .map((line) => extractTitleValue(line))
      .filter((v): v is string => v !== null);

    // --- Check 2: All title assignments must be non-empty and meaningful ---
    const emptyTitles = titleValues.filter((v) => !isMeaningfulTitle(v));
    if (emptyTitles.length > 0) {
      errors.push(
        'One or more document.title assignments set an empty or meaningless value. Each page needs a descriptive title.',
      );
    }

    // If we couldn't extract any values but assignments exist, check for dynamic approach
    if (titleValues.length === 0) {
      const hasDynamic = /document\.title\s*=\s*[a-zA-Z_$]/.test(scriptContent);
      if (!hasDynamic) {
        errors.push(
          'Could not determine the title values. Make sure document.title is set to a string value.',
        );
      }
    }

    // --- Check 3: App name "MyPage" must be part of the title ---
    // For static titles: the app name must appear in each title value.
    // For dynamic titles: the app name must appear in the title expression line
    //   or in a variable that is used in the title assignment.
    const meaningfulTitles = titleValues.filter(isMeaningfulTitle);

    const isDynamic = titleAssignmentLines.some(
      (line) =>
        /document\.title\s*=\s*(`[^`]*\$\{|[a-zA-Z_$]\w*\s*[+`])/.test(line) ||
        /document\.title\s*=\s*['"][^'"]*['"]\s*\+/.test(line) ||
        /\+\s*['"][^'"]*['"]/.test(line.split('document.title')[1] ?? ''),
    );

    if (isDynamic) {
      // Dynamic approach: check if app name is referenced in title lines or in a
      // variable/constant that feeds into the title
      const appInTitleLines = titleAssignmentLines.some((line) =>
        new RegExp(APP_NAME, 'i').test(line),
      );
      if (!appInTitleLines) {
        // Check if there's a variable containing the app name used in title
        const appNameVarPattern = new RegExp(
          `(?:const|let|var)\\s+(\\w+)\\s*=\\s*['"\`][^'"\`]*${APP_NAME}[^'"\`]*['"\`]`,
          'i',
        );
        const varMatch = scriptContent.match(appNameVarPattern);
        const varUsedInTitle =
          varMatch &&
          titleAssignmentLines.some((line) => line.includes(varMatch[1]));

        if (!varUsedInTitle) {
          errors.push(
            'The app name "MyPage" must be part of the page title. Use a pattern like "Home - MyPage" or "About | MyPage".',
          );
        }
      }
    } else if (meaningfulTitles.length > 0) {
      // Static approach: every title value must contain the app name
      const titlesWithoutAppName = meaningfulTitles.filter(
        (t) => !containsAppName(t),
      );
      if (titlesWithoutAppName.length > 0) {
        errors.push(
          `${titlesWithoutAppName.length} title(s) are missing the app name "MyPage". Every page title should include the app name (e.g., "Home - MyPage" or "About | MyPage").`,
        );
      }
    }

    // --- Check 4: Each page must get a distinct title ---
    if (!isDynamic && meaningfulTitles.length > 0) {
      // Static approach — need enough unique titles for all pages
      const uniqueTitles = new Set(
        meaningfulTitles.map((t) => t.toLowerCase().trim()),
      );
      if (uniqueTitles.size < EXPECTED_PAGES.length) {
        errors.push(
          `Only ${uniqueTitles.size} unique title(s) found, but ${EXPECTED_PAGES.length} pages exist. Each page needs its own distinct title.`,
        );
      }
    }

    return buildResult(errors);
  },
};

function buildResult(errors: string[]): ValidationResult {
  const passed = errors.length === 0;
  return {
    validatorId: 'page-title',
    passed,
    message: passed
      ? 'document.title is correctly updated with unique titles for each page.'
      : `Page title management has ${errors.length} issue(s).`,
    details: passed ? undefined : errors.join('\n'),
  };
}
