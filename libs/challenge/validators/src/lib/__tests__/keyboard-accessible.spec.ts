import { describe, it, expect, afterEach } from 'vitest';
import { keyboardAccessible } from '../keyboard-accessible';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

function createAnalysisResult(
  nonFocusableInteractive: string[] = [],
): AccessibilityAnalysisResult {
  return {
    axeResults: [],
    treeNodes: { role: 'document', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive,
    },
    focusResults: {
      focusTraps: [],
      hiddenFocusable: [],
      focusOrder: [],
    },
  };
}

describe('keyboard-accessible', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "keyboard-accessible"', async () => {
    expect(keyboardAccessible.id).toBe('keyboard-accessible');
  });

  describe('keyboard accessible elements → pass', () => {
    it('should pass when a button has onclick', async () => {
      document.body.innerHTML = `
        <button onclick="alert('clicked')">Click me</button>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when no elements have onclick', async () => {
      document.body.innerHTML = `
        <button>Just a button</button>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when a div with onclick has tabindex="0"', async () => {
      document.body.innerHTML = `
        <div onclick="doAction()" tabindex="0">Focusable div</div>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when an anchor with onclick is used', async () => {
      document.body.innerHTML = `
        <a href="#" onclick="navigate()">Link</a>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(true);
    });

    it('should pass when an input has onclick', async () => {
      document.body.innerHTML = `
        <input type="button" onclick="submit()" value="Go">
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('keyboard inaccessible elements → fail', () => {
    it('should fail when a div has onclick without tabindex', async () => {
      document.body.innerHTML = `
        <div class="action-btn" onclick="alert('Clicked!')">Absenden</div>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should fail when a span has onclick without tabindex', async () => {
      document.body.innerHTML = `
        <span onclick="doAction()">Click</span>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(false);
    });

    it('should fail when a div has tabindex="-1" with onclick', async () => {
      document.body.innerHTML = `
        <div onclick="doAction()" tabindex="-1">Not focusable</div>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.passed).toBe(false);
    });

    it('should include details about inaccessible elements', async () => {
      document.body.innerHTML = `
        <div onclick="doSomething()">Click</div>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(),
      );

      expect(result.details).toContain('<div>');
      expect(result.details).toContain('not keyboard focusable');
    });
  });

  describe('context-based analysis', () => {
    it('should fail when keyboard analysis reports non-focusable interactive elements', async () => {
      document.body.innerHTML = `
        <button>Submit</button>
      `;

      const result = await keyboardAccessible.validate(
        document,
        createAnalysisResult(['div.action-btn']),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('div.action-btn');
    });

    it('should pass without context when DOM has no issues', async () => {
      document.body.innerHTML = `
        <button onclick="go()">Go</button>
      `;

      const result = await keyboardAccessible.validate(document);

      expect(result.passed).toBe(true);
    });
  });
});
