import { describe, it, expect, afterEach } from 'vitest';
import { interactiveElementName } from '../interactive-element-name';

describe('interactive-element-name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "interactive-element-name"', () => {
    expect(interactiveElementName.id).toBe('interactive-element-name');
  });

  describe('elements with accessible names → pass', () => {
    it('should pass when buttons have aria-label', () => {
      document.body.innerHTML = `
        <button aria-label="Open menu">
          <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2z"/></svg>
        </button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when links have aria-label', () => {
      document.body.innerHTML = `
        <a href="/home" aria-label="Home">
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3"/></svg>
        </a>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when links contain an img with alt text', () => {
      document.body.innerHTML = `
        <a href="/profile">
          <img src="avatar.png" alt="User profile">
        </a>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when buttons have visible text', () => {
      document.body.innerHTML = `
        <button>Submit</button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when elements use aria-labelledby', () => {
      document.body.innerHTML = `
        <span id="menu-label">Open menu</span>
        <button aria-labelledby="menu-label">
          <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2z"/></svg>
        </button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when elements have a title attribute', () => {
      document.body.innerHTML = `
        <button title="Close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5"/></svg>
        </button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when no interactive elements exist', () => {
      document.body.innerHTML = `
        <p>No buttons or links here</p>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('elements without accessible names → fail', () => {
    it('should fail when a button contains only an SVG without aria-label', () => {
      document.body.innerHTML = `
        <button>
          <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2z"/></svg>
        </button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should fail when a link contains only an icon element', () => {
      document.body.innerHTML = `
        <a href="/search"><i class="icon-search"></i></a>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('<a>');
    });

    it('should fail when a link contains an img without alt', () => {
      document.body.innerHTML = `
        <a href="/profile"><img src="avatar.png"></a>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should fail when a link contains an img with empty alt', () => {
      document.body.innerHTML = `
        <a href="/profile"><img src="avatar.png" alt=""></a>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should report correct count of issues', () => {
      document.body.innerHTML = `
        <a href="/home"><svg viewBox="0 0 24 24"><path d="M10 20"/></svg></a>
        <a href="/search"><i class="icon-search"></i></a>
        <button><svg viewBox="0 0 24 24"><path d="M3 18h18"/></svg></button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('3');
    });

    it('should not count aria-hidden text as visible text', () => {
      document.body.innerHTML = `
        <button>
          <span aria-hidden="true">🔍</span>
        </button>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
    });
  });

  describe('the full starter code from the challenge', () => {
    it('should fail on the starter code', () => {
      document.body.innerHTML = `
        <nav>
          <a href="/home"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></a>
          <a href="/search"><i class="icon-search"></i></a>
          <a href="/profile"><img src="avatar.png"></a>
        </nav>
        <div class="toolbar">
          <button><svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></button>
          <button><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
          <button>❤️</button>
        </div>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(false);
      // 3 links + 2 buttons without names (the ❤️ button has visible text)
      expect(result.message).toContain('5');
    });

    it('should pass on the solution code', () => {
      document.body.innerHTML = `
        <nav>
          <a href="/home" aria-label="Home">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </a>
          <a href="/search" aria-label="Search">
            <i class="icon-search" aria-hidden="true"></i>
          </a>
          <a href="/profile">
            <img src="avatar.png" alt="User profile">
          </a>
        </nav>
        <div class="toolbar">
          <button aria-label="Open menu">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <button aria-label="Close">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
          <button aria-label="Add to favorites">❤️</button>
        </div>
      `;

      const result = interactiveElementName.validate(document);

      expect(result.passed).toBe(true);
    });
  });
});
