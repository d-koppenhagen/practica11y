import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that no axe-core violations are present in the analysis result.
 */
export const axeNoViolations: Validator = {
  id: 'axe-no-violations',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    if (!analysisResult) {
      return {
        validatorId: 'axe-no-violations',
        passed: false,
        message: 'Axe Scan: No analysis result available.',
      };
    }

    const violations = analysisResult.axeResults;
    const passed = violations.length === 0;

    return {
      validatorId: 'axe-no-violations',
      passed,
      message: passed
        ? 'Axe Scan: No accessibility violations found.'
        : `Axe Scan: ${violations.length} accessibility violation(s) found.`,
      details: passed
        ? undefined
        : violations
            .map((v) => `[${v.impact}] ${v.description} (${v.id})`)
            .join('\n'),
    };
  },
};
