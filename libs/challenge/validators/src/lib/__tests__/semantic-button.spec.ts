import { describe, it, expect, afterEach } from 'vitest';
import { semanticButton } from '../semantic-button';

describe('semantic-button', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "semantic-button"', () => {
    expect(semanticButton.id).toBe('semantic-button');
  });

  describe('semantic clickable elements → pass', () => {
    it('should pass when a button element has onclick', () => {
      document.body.innerHTML = `
        <button onclick="alert('clicked')">Click me</button>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when an anchor element has onclick', () => {
      document.body.innerHTML = `
        <a href="#" onclick="doSomething()">Link</a>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when no elements have onclick but semantic elements exist', () => {
      document.body.innerHTML = `
        <div>No click handlers</div>
        <p>Just content</p>
        <button>A button</button>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when a div has role="button" with onclick', () => {
      document.body.innerHTML = `
        <div role="button" onclick="alert('clicked')">Custom button</div>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when a span has role="link" with onclick', () => {
      document.body.innerHTML = `
        <span role="link" onclick="navigate()">Go somewhere</span>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('non-semantic clickable elements → fail', () => {
    it('should fail when a div has onclick without role', () => {
      document.body.innerHTML = `
        <div class="action-btn" onclick="alert('Clicked!')">Absenden</div>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should fail when a span has onclick without role', () => {
      document.body.innerHTML = `
        <span onclick="doAction()">Click</span>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should report multiple non-semantic clickables', () => {
      document.body.innerHTML = `
        <div onclick="action1()">First</div>
        <span onclick="action2()">Second</span>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2');
    });

    it('should include element details in the result', () => {
      document.body.innerHTML = `
        <div class="btn" onclick="doSomething()">Click</div>
      `;

      const result = semanticButton.validate(document);

      expect(result.details).toContain('<div>');
      expect(result.details).toContain('class="btn"');
    });
  });

  describe('edge cases', () => {
    it('should fail when no semantic interactive elements exist', () => {
      document.body.innerHTML = `
        <div>No click handlers</div>
        <p>Just content</p>
      `;

      const result = semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No semantic interactive element');
    });
  });
});
