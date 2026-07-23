import { describe, it, expect, afterEach } from 'vitest';
import { semanticButton } from '../semantic-button';

describe('semantic-button', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "semantic-button"', async () => {
    expect(semanticButton.id).toBe('semantic-button');
  });

  describe('semantic clickable elements → pass', () => {
    it('should pass when a button element has onclick', async () => {
      document.body.innerHTML = `
        <button onclick="alert('clicked')">Click me</button>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when an anchor element has onclick', async () => {
      document.body.innerHTML = `
        <a href="#" onclick="doSomething()">Link</a>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when no elements have onclick but semantic elements exist', async () => {
      document.body.innerHTML = `
        <div>No click handlers</div>
        <p>Just content</p>
        <button>A button</button>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when a div has role="button" with onclick', async () => {
      document.body.innerHTML = `
        <div role="button" onclick="alert('clicked')">Custom button</div>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when a span has role="link" with onclick', async () => {
      document.body.innerHTML = `
        <span role="link" onclick="navigate()">Go somewhere</span>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('non-semantic clickable elements → fail', () => {
    it('should fail when a div has onclick without role', async () => {
      document.body.innerHTML = `
        <div class="action-btn" onclick="alert('Clicked!')">Absenden</div>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should fail when a span has onclick without role', async () => {
      document.body.innerHTML = `
        <span onclick="doAction()">Click</span>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should report multiple non-semantic clickables', async () => {
      document.body.innerHTML = `
        <div onclick="action1()">First</div>
        <span onclick="action2()">Second</span>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2');
    });

    it('should include element details in the result', async () => {
      document.body.innerHTML = `
        <div class="btn" onclick="doSomething()">Click</div>
      `;

      const result = await semanticButton.validate(document);

      expect(result.details).toContain('<div>');
      expect(result.details).toContain('class="btn"');
    });
  });

  describe('edge cases', () => {
    it('should fail when no semantic interactive elements exist', async () => {
      document.body.innerHTML = `
        <div>No click handlers</div>
        <p>Just content</p>
      `;

      const result = await semanticButton.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No semantic interactive element');
    });
  });
});
