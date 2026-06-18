import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates WCAG-compliant color contrasts via axe-core contrast-related results.
 */
export const colorContrast: Validator = {
  id: 'color-contrast',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    if (!analysisResult) {
      return {
        validatorId: 'color-contrast',
        passed: false,
        message: 'No analysis result available.',
      };
    }

    const contrastViolations = analysisResult.axeResults.filter(
      (v) => v.id === 'color-contrast',
    );
    const passed = contrastViolations.length === 0;

    const totalNodes = contrastViolations.reduce(
      (sum, v) => sum + v.nodes.length,
      0,
    );

    return {
      validatorId: 'color-contrast',
      passed,
      message: passed
        ? 'All color contrasts meet WCAG requirements.'
        : `${totalNodes} element(s) have insufficient color contrast.`,
      details: passed
        ? undefined
        : contrastViolations
            .flatMap((v) =>
              v.nodes.map((n) => `${n.html}: ${n.failureSummary}`),
            )
            .join('\n'),
    };
  },
};
