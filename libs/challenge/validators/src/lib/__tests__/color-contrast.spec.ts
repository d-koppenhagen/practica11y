import { describe, it, expect } from 'vitest';
import { colorContrast } from '../color-contrast';
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

function createContrastViolation(nodeCount = 1): AxeViolation {
  return {
    id: 'color-contrast',
    impact: 'serious',
    description: 'Elements must have sufficient color contrast',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      html: `<p class="low-contrast-${i}">Text</p>`,
      target: [`p.low-contrast-${i}`],
      failureSummary: 'Expected contrast ratio of 4.5:1, found 2.1:1',
    })),
  };
}

describe('color-contrast', () => {
  it('should have id "color-contrast"', () => {
    expect(colorContrast.id).toBe('color-contrast');
  });

  describe('no contrast violations → pass', () => {
    it('should pass when no contrast violations exist', () => {
      const result = colorContrast.validate(document, createAnalysisResult([]));

      expect(result.passed).toBe(true);
      expect(result.message).toContain('WCAG');
    });

    it('should pass when violations exist but none are color-contrast', () => {
      const otherViolation: AxeViolation = {
        id: 'image-alt',
        impact: 'critical',
        description: 'Images must have alt text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
        nodes: [
          { html: '<img>', target: ['img'], failureSummary: 'Missing alt' },
        ],
      };

      const result = colorContrast.validate(
        document,
        createAnalysisResult([otherViolation]),
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('contrast violations → fail', () => {
    it('should fail when contrast violations are present', () => {
      const violations = [createContrastViolation(2)];

      const result = colorContrast.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2');
    });

    it('should include details about affected elements', () => {
      const violations = [createContrastViolation(1)];

      const result = colorContrast.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.details).toBeDefined();
      expect(result.details).toContain('low-contrast');
    });

    it('should count total nodes across multiple contrast violations', () => {
      const violations = [
        createContrastViolation(2),
        createContrastViolation(3),
      ];

      const result = colorContrast.validate(
        document,
        createAnalysisResult(violations),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('5');
    });
  });

  describe('no context → fail', () => {
    it('should fail when no context is provided', () => {
      const result = colorContrast.validate(document, undefined);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No analysis result');
    });
  });
});
