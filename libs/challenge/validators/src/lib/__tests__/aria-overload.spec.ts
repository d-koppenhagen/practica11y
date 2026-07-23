import { describe, it, expect } from 'vitest';
import { ariaOverload } from '../aria-overload';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('ariaOverload', () => {
  describe('redundant aria-label', () => {
    it('fails when aria-label repeats the element role name', async () => {
      const doc = createDoc(
        '<section aria-label="Section"><h2>Content</h2></section>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('merely repeats');
    });

    it('fails for blockquote with aria-label="Blockquote"', async () => {
      const doc = createDoc(
        '<blockquote aria-label="Blockquote"><p>A quote</p></blockquote>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('merely repeats');
    });

    it('passes when aria-label provides a descriptive name', async () => {
      const doc = createDoc(
        '<section aria-label="Newsletter signup"><h2>Content</h2></section>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(true);
    });
  });

  describe('incorrect roles', () => {
    it('fails when role="menuitem" is used outside a menu', async () => {
      const doc = createDoc('<button role="menuitem">Action</button>');
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('outside a valid parent context');
    });

    it('passes when role="menuitem" is inside a menu', async () => {
      const doc = createDoc(
        '<div role="menu"><button role="menuitem">Action</button></div>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(true);
    });

    it('fails for link with role="menuitem" outside menu context', async () => {
      const doc = createDoc(
        '<nav aria-label="Main"><ul><li><a href="/home" role="menuitem">Home</a></li></ul></nav>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('"menuitem" role requires');
    });
  });

  describe('broken aria-controls', () => {
    it('fails when aria-controls references a non-existent ID', async () => {
      const doc = createDoc('<button aria-controls="menu">Toggle</button>');
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('does not exist in the DOM');
    });

    it('passes when aria-controls references an existing ID', async () => {
      const doc = createDoc(
        '<button aria-controls="menu">Toggle</button><ul id="menu"><li>Item</li></ul>',
      );
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(true);
    });
  });

  describe('combined scenarios', () => {
    it('fails on the starter HTML with multiple issues', async () => {
      const doc = createDoc(`
        <section aria-label="Section">
          <button type="submit" role="menuitem" aria-controls="menu">Subscribe</button>
        </section>
        <nav aria-label="Navigation">
          <a href="/features" role="menuitem">Features</a>
        </nav>
        <blockquote aria-label="Blockquote"><p>Quote</p></blockquote>
      `);
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.message).toMatch(/\d+ ARIA issue/);
    });

    it('passes on clean solution HTML', async () => {
      const doc = createDoc(`
        <section aria-label="Newsletter">
          <button type="submit">Subscribe</button>
        </section>
        <nav aria-label="Main">
          <a href="/features">Features</a>
        </nav>
        <section aria-label="Testimonials">
          <blockquote><p>Quote</p></blockquote>
        </section>
      `);
      const result = await ariaOverload.validate(doc);
      expect(result.passed).toBe(true);
    });
  });
});
