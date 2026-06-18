import { describe, it, expect } from 'vitest';
import { axeNoViolations } from '../axe-no-violations';
import type {
  AccessibilityAnalysisResult,
  AxeViolation,
} from '@practica11y/types';

function createAnalysisResult(
  violations: AxeViolation[] = [],
): AccessibilityAnalysisResult {
  return {
    axeResults: violations,
    treeNodes: { role: 'document', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
  };
}

function createViolation(overrides: Partial<AxeViolation> = {}): AxeViolation {
  return {
    id: 'color-contrast',
    impact: 'serious',
    description: 'Elements must have sufficient color contrast',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
    nodes: [
      { html: '<p>text</p>', target: ['p'], failureSummary: 'Fix contrast' },
    ],
    ...overrides,
  };
}

describe('axe-no-violations', () => {
  it('should have id "axe-no-violations"', () => {
    expect(axeNoViolations.id).toBe('axe-no-violations');
  });

  describe('no violations → pass', () => {
    it('should pass when axeResults is empty', () => {
      const result = axeNoViolations.validate(
        document,
        createAnalysisResult([]),
      );

      expect(result.passed).toBe(true);
      expect(result.validatorId).toBe('axe-no-violations');
    });
  });

  describe('some violations → fail', () => {
    it('should fail when there are violations', () => {
      const violations = [createViolation()];
      const result = axeNoViolations.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should report the correct number of violations', () => {
      const violations = [
        createViolation({ id: 'rule-1' }),
        createViolation({ id: 'rule-2' }),
        createViolation({ id: 'rule-3' }),
      ];
      const result = axeNoViolations.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('3');
    });

    it('should include violation details', () => {
      const violations = [
        createViolation({
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alt text',
        }),
      ];
      const result = axeNoViolations.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.details).toContain('image-alt');
      expect(result.details).toContain('critical');
    });
  });

  describe('no context → fail', () => {
    it('should fail when no context is provided', () => {
      const result = axeNoViolations.validate(document, undefined);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No analysis result');
    });
  });
});
