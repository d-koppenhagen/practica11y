import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown-renderer';

describe('renderMarkdown', () => {
  describe('Markdown element rendering', () => {
    it('should render h1 heading', () => {
      const result = renderMarkdown('# Hello');
      expect(result).toContain('<h1');
      expect(result).toContain('Hello');
    });

    it('should render h2 heading', () => {
      const result = renderMarkdown('## Subheading');
      expect(result).toContain('<h2');
      expect(result).toContain('Subheading');
    });

    it('should render paragraphs', () => {
      const result = renderMarkdown('This is a paragraph.');
      expect(result).toContain('<p>');
      expect(result).toContain('This is a paragraph.');
    });

    it('should render inline code', () => {
      const result = renderMarkdown('Use `console.log()` for debugging.');
      expect(result).toContain('<code>');
      expect(result).toContain('console.log()');
    });

    it('should render fenced code blocks', () => {
      const result = renderMarkdown('```\nconst x = 1;\n```');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('should render ordered lists', () => {
      const result = renderMarkdown('1. First\n2. Second\n3. Third');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>');
      expect(result).toContain('First');
    });

    it('should render unordered lists', () => {
      const result = renderMarkdown('- Apple\n- Banana\n- Cherry');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Apple');
    });

    it('should render bold text', () => {
      const result = renderMarkdown('This is **bold** text.');
      expect(result).toContain('<strong>');
      expect(result).toContain('bold');
    });

    it('should render italic text', () => {
      const result = renderMarkdown('This is *italic* text.');
      expect(result).toContain('<em>');
      expect(result).toContain('italic');
    });

    it('should render links', () => {
      const result = renderMarkdown('[Click here](https://example.com)');
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Click here');
    });
  });

  describe('Sanitization - script tags', () => {
    it('should remove script tags with content', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('</script>');
      expect(result).not.toContain('alert');
    });

    it('should remove self-closing script tags', () => {
      const result = renderMarkdown('<script src="evil.js"/>');
      expect(result).not.toContain('<script');
    });
  });

  describe('Sanitization - event handler attributes', () => {
    it('should remove onclick attributes', () => {
      const result = renderMarkdown('<div onclick="alert(1)">content</div>');
      expect(result).not.toMatch(/onclick/i);
    });

    it('should remove onerror attributes', () => {
      const result = renderMarkdown('<img src="x" onerror="alert(1)">');
      expect(result).not.toMatch(/onerror/i);
    });

    it('should remove onload attributes', () => {
      const result = renderMarkdown('<body onload="alert(1)">text</body>');
      expect(result).not.toMatch(/onload/i);
    });
  });

  describe('Sanitization - javascript: URLs', () => {
    it('should neutralize javascript: href URLs', () => {
      const result = renderMarkdown('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
    });

    it('should neutralize javascript: src URLs', () => {
      const result = renderMarkdown(
        '<iframe src="javascript:alert(1)"></iframe>',
      );
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Error fallback', () => {
    it('should return raw text when input is empty', () => {
      const result = renderMarkdown('');
      expect(result).toBe('');
    });

    it('should handle plain text without Markdown syntax', () => {
      const result = renderMarkdown('Just plain text');
      expect(result).toContain('Just plain text');
    });
  });
});
