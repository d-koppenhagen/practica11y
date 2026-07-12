import { describe, it, expect, afterEach } from 'vitest';
import { noPositiveTabindex } from '../no-positive-tabindex';

describe('no-positive-tabindex', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "no-positive-tabindex"', () => {
    expect(noPositiveTabindex.id).toBe('no-positive-tabindex');
  });

  describe('no positive tabindex → pass', () => {
    it('should pass when no tabindex attributes are present', () => {
      document.body.innerHTML = `
        <a href="#home">Home</a>
        <button>Submit</button>
        <input type="text">
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No positive tabindex');
    });

    it('should pass when tabindex="0" is used', () => {
      document.body.innerHTML = `
        <div tabindex="0" role="button">Custom Widget</div>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when tabindex="-1" is used', () => {
      document.body.innerHTML = `
        <div tabindex="-1" id="modal-content">Modal</div>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when both tabindex="0" and tabindex="-1" are used', () => {
      document.body.innerHTML = `
        <div tabindex="0" role="button">Focusable</div>
        <div tabindex="-1" id="skip-target">Target</div>
        <a href="#link">Link</a>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('positive tabindex → fail', () => {
    it('should fail when an element has tabindex="1"', () => {
      document.body.innerHTML = `
        <a href="#home" tabindex="1">Home</a>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1 tabindex issue(s)');
    });

    it('should fail when multiple elements have positive tabindex', () => {
      document.body.innerHTML = `
        <a href="#home" tabindex="3">Home</a>
        <a href="#about" tabindex="7">About</a>
        <input type="text" tabindex="5">
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('3 tabindex issue(s)');
    });

    it('should include details about offending elements', () => {
      document.body.innerHTML = `
        <button tabindex="2">Submit</button>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('<button>');
      expect(result.details).toContain('tabindex="2"');
      expect(result.details).toContain('Submit');
    });

    it('should only report positive values, not zero or negative', () => {
      document.body.innerHTML = `
        <a href="#home" tabindex="0">Home</a>
        <a href="#about" tabindex="-1">About</a>
        <a href="#contact" tabindex="5">Contact</a>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1 tabindex issue(s)');
      expect(result.details).toContain('tabindex="5"');
    });
  });

  describe('skip-link target validation', () => {
    it('should pass when skip-link target has tabindex="-1"', () => {
      document.body.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <main id="main-content" tabindex="-1">
          <h1>Content</h1>
        </main>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should fail when skip-link target has a positive tabindex', () => {
      document.body.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <main id="main-content" tabindex="2">
          <h1>Content</h1>
        </main>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('skip-link target');
      expect(result.details).toContain('tabindex="-1"');
    });

    it('should fail when skip-link target has tabindex="0"', () => {
      document.body.innerHTML = `
        <a href="#main-content">Skip to content</a>
        <main id="main-content" tabindex="0">
          <h1>Content</h1>
        </main>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('tabindex="0"');
      expect(result.details).toContain('tabindex="-1"');
    });

    it('should fail when skip-link target has no tabindex at all', () => {
      document.body.innerHTML = `
        <a href="#main-content">Skip to main</a>
        <main id="main-content">
          <h1>Content</h1>
        </main>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('tabindex="none"');
      expect(result.details).toContain('tabindex="-1"');
    });

    it('should not flag non-skip links', () => {
      document.body.innerHTML = `
        <a href="#section">Go to section</a>
        <div id="section">
          <h2>Section</h2>
        </div>
      `;

      const result = noPositiveTabindex.validate(document);

      expect(result.passed).toBe(true);
    });
  });
});
