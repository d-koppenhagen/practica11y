import type { Validator, ValidationResult } from '@practica11y/models';
import type {
  AccessibilityAnalysisResult,
  AccessibilityNode,
} from '@practica11y/types';

/**
 * Validates correct heading hierarchy: h1→h2→h3, no skipped levels.
 */
export const headingStructure: Validator = {
  id: 'heading-structure',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;

    if (!analysisResult) {
      return {
        validatorId: 'heading-structure',
        passed: false,
        message: 'No analysis result available.',
      };
    }

    const headings = findHeadings(analysisResult.treeNodes);

    if (headings.length === 0) {
      return {
        validatorId: 'heading-structure',
        passed: false,
        message: 'No headings found in the document.',
      };
    }

    const errors = validateHeadingHierarchy(headings);
    const passed = errors.length === 0;

    return {
      validatorId: 'heading-structure',
      passed,
      message: passed
        ? 'Heading hierarchy is correct.'
        : `Heading hierarchy has ${errors.length} issue(s).`,
      details: passed ? undefined : errors.join('\n'),
    };
  },
};

interface HeadingInfo {
  level: number;
  name: string | undefined;
}

function findHeadings(node: AccessibilityNode): HeadingInfo[] {
  const results: HeadingInfo[] = [];

  if (node.role === 'heading' && node.level != null) {
    results.push({ level: node.level, name: node.name });
  }

  for (const child of node.children) {
    results.push(...findHeadings(child));
  }

  return results;
}

function validateHeadingHierarchy(headings: HeadingInfo[]): string[] {
  const errors: string[] = [];

  // First heading should be h1
  if (headings[0].level !== 1) {
    errors.push(`First heading should be h1, found h${headings[0].level}.`);
  }

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i].level;
    const previous = headings[i - 1].level;

    // Going deeper: only allowed to increase by 1
    if (current > previous + 1) {
      const skipped = Array.from(
        { length: current - previous - 1 },
        (_, k) => `h${previous + k + 1}`,
      ).join(', ');
      errors.push(
        `Skipped heading level(s) ${skipped} before h${current}${headings[i].name ? ` ("${headings[i].name}")` : ''}.`,
      );
    }
  }

  return errors;
}
