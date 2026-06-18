import type { Validator, ValidationResult } from '@practica11y/models';
import type {
  AccessibilityAnalysisResult,
  AccessibilityNode,
} from '@practica11y/types';

/**
 * Expected landmark roles for a complete page structure.
 * Maps ARIA roles to their corresponding HTML elements for user-friendly messages.
 */
const REQUIRED_LANDMARKS: { role: string; label: string }[] = [
  { role: 'banner', label: '<header>' },
  { role: 'navigation', label: '<nav>' },
  { role: 'main', label: '<main>' },
  { role: 'contentinfo', label: '<footer>' },
  { role: 'complementary', label: '<aside>' },
];

/**
 * Validates that ALL expected landmark regions are present in the document.
 * Unlike `has-landmarks` (which passes with any single landmark),
 * this validator requires header, nav, main, footer, and aside.
 */
export const hasAllLandmarks: Validator = {
  id: 'has-all-landmarks',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    if (!analysisResult) {
      return {
        validatorId: 'has-all-landmarks',
        passed: false,
        message: 'No analysis result available.',
      };
    }

    const foundRoles = collectLandmarkRoles(analysisResult.treeNodes);
    const missing = REQUIRED_LANDMARKS.filter((l) => !foundRoles.has(l.role));
    const passed = missing.length === 0;

    return {
      validatorId: 'has-all-landmarks',
      passed,
      message: passed
        ? `All ${REQUIRED_LANDMARKS.length} required landmark regions found.`
        : `Missing landmark region(s): ${missing.map((m) => m.label).join(', ')}.`,
      details: passed
        ? REQUIRED_LANDMARKS.map((l) => `✓ ${l.role} (${l.label})`).join(', ')
        : missing.map((m) => `✗ ${m.role} (${m.label})`).join(', '),
    };
  },
};

function collectLandmarkRoles(node: AccessibilityNode): Set<string> {
  const roles = new Set<string>();

  if (node.role) {
    roles.add(node.role);
  }

  for (const child of node.children) {
    for (const role of collectLandmarkRoles(child)) {
      roles.add(role);
    }
  }

  return roles;
}
