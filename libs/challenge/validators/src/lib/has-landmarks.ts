import type { Validator, ValidationResult } from '@practica11y/models';
import type {
  AccessibilityAnalysisResult,
  AccessibilityNode,
} from '@practica11y/types';

const LANDMARK_ROLES = new Set([
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'main',
  'navigation',
  'region',
  'search',
]);

/**
 * Validates that landmark regions are present in the document's accessibility tree.
 */
export const hasLandmarks: Validator = {
  id: 'has-landmarks',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    if (!analysisResult) {
      return {
        validatorId: 'has-landmarks',
        passed: false,
        message: 'No analysis result available.',
      };
    }

    const landmarks = findLandmarks(analysisResult.treeNodes);
    const passed = landmarks.length > 0;

    return {
      validatorId: 'has-landmarks',
      passed,
      message: passed
        ? `${landmarks.length} landmark region(s) found.`
        : 'No landmark regions found. Use semantic HTML elements like <main>, <nav>, <header>, <footer>.',
      details: passed
        ? landmarks
            .map((l) => `${l.role}${l.name ? ` ("${l.name}")` : ''}`)
            .join(', ')
        : undefined,
    };
  },
};

function findLandmarks(node: AccessibilityNode): AccessibilityNode[] {
  const results: AccessibilityNode[] = [];

  if (LANDMARK_ROLES.has(node.role)) {
    results.push(node);
  }

  for (const child of node.children) {
    results.push(...findLandmarks(child));
  }

  return results;
}
