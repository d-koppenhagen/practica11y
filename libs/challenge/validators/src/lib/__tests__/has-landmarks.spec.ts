import { describe, it, expect } from 'vitest';
import { hasLandmarks } from '../has-landmarks';
import type {
  AccessibilityAnalysisResult,
  AccessibilityNode,
} from '@practica11y/types';

function createAnalysisResult(
  treeNodes: AccessibilityNode,
): AccessibilityAnalysisResult {
  return {
    axeResults: [],
    treeNodes,
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
  };
}

describe('has-landmarks', () => {
  it('should have id "has-landmarks"', () => {
    expect(hasLandmarks.id).toBe('has-landmarks');
  });

  describe('landmarks present → pass', () => {
    it('should pass when landmarks are present in the tree', () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          { role: 'banner', name: 'Header', children: [] },
          { role: 'main', name: 'Main content', children: [] },
          { role: 'contentinfo', name: 'Footer', children: [] },
        ],
      };

      const result = hasLandmarks.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
      expect(result.message).toContain('3');
    });

    it('should pass with a single landmark', () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [{ role: 'navigation', name: 'Main Nav', children: [] }],
      };

      const result = hasLandmarks.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
    });

    it('should find nested landmarks', () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          {
            role: 'generic',
            children: [{ role: 'main', name: 'Content', children: [] }],
          },
        ],
      };

      const result = hasLandmarks.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('no landmarks → fail', () => {
    it('should fail when no landmarks are found', () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          { role: 'generic', children: [] },
          { role: 'heading', level: 1, name: 'Title', children: [] },
          { role: 'paragraph', children: [] },
        ],
      };

      const result = hasLandmarks.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No landmark');
    });

    it('should fail for completely empty tree', () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [],
      };

      const result = hasLandmarks.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
    });
  });

  describe('no context → fail', () => {
    it('should fail when no context is provided', () => {
      const result = hasLandmarks.validate(document, undefined);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No analysis result');
    });
  });
});
