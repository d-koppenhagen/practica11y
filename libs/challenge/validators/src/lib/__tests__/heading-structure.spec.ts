import { describe, it, expect } from 'vitest';
import { headingStructure } from '../heading-structure';
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

function heading(level: number, name?: string): AccessibilityNode {
  return { role: 'heading', level, name, children: [] };
}

describe('heading-structure', () => {
  it('should have id "heading-structure"', async () => {
    expect(headingStructure.id).toBe('heading-structure');
  });

  describe('correct hierarchy → pass', () => {
    it('should pass with h1 → h2 → h3 hierarchy', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          heading(1, 'Main Title'),
          heading(2, 'Section'),
          heading(3, 'Subsection'),
        ],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when going back up in level (h1 → h2 → h3 → h2)', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          heading(1, 'Title'),
          heading(2, 'Section A'),
          heading(3, 'Sub A'),
          heading(2, 'Section B'),
        ],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass with a single h1', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [heading(1, 'Only Heading')],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('skipped levels → fail', () => {
    it('should fail when h1 jumps to h3 (skipping h2)', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [heading(1, 'Title'), heading(3, 'Subsection')],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('h2');
    });

    it('should fail when first heading is not h1', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [heading(2, 'Not a h1'), heading(3, 'Sub')],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('h1');
    });

    it('should fail when multiple levels are skipped', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [heading(1, 'Title'), heading(4, 'Deep heading')],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('h2');
      expect(result.details).toContain('h3');
    });
  });

  describe('no headings → fail', () => {
    it('should fail when there are no headings in the tree', async () => {
      const tree: AccessibilityNode = {
        role: 'document',
        children: [
          { role: 'paragraph', children: [] },
          { role: 'generic', children: [] },
        ],
      };

      const result = await headingStructure.validate(
        document,
        createAnalysisResult(tree),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No headings');
    });
  });

  describe('no context → fail', () => {
    it('should fail when no context is provided', async () => {
      const result = await headingStructure.validate(document, undefined);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No analysis result');
    });
  });
});
