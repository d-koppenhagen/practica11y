import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseMarkdownBody } from './frontmatter-parser';
import type { ChallengeMeta } from '@practica11y/models';

const VALID_FRONTMATTER = `---
id: clickable-div
title: Clickable Div
difficulty: beginner
tags:
  - semantics
  - keyboard
points: 100
starter:
  html: starter.html
  css: starter.css
validators:
  - semantic-button
  - keyboard-accessible
---

# Challenge Description

Fix the clickable div.`;

const VALID_META: ChallengeMeta = {
  id: 'clickable-div',
  title: 'Clickable Div',
  difficulty: 'beginner',
  tags: ['semantics', 'keyboard'],
  points: 100,
  starter: {
    html: 'starter.html',
    css: 'starter.css',
  },
  validators: ['semantic-button', 'keyboard-accessible'],
};

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter and return ChallengeMeta', () => {
    const result = parseFrontmatter(VALID_FRONTMATTER);
    expect(result).toEqual(VALID_META);
  });

  it('should handle frontmatter without optional css starter', () => {
    const raw = `---
id: test-challenge
title: Test Challenge
difficulty: intermediate
tags:
  - forms
points: 50
starter:
  html: index.html
validators:
  - form-labels
---

Body content`;

    const result = parseFrontmatter(raw);
    expect(result.starter).toEqual({ html: 'index.html' });
    expect(result.starter.css).toBeUndefined();
  });

  it('should throw on empty input', () => {
    expect(() => parseFrontmatter('')).toThrow('Input is empty');
  });

  it('should throw on whitespace-only input', () => {
    expect(() => parseFrontmatter('   \n  ')).toThrow('Input is empty');
  });

  it('should throw when no frontmatter delimiters are present', () => {
    expect(() =>
      parseFrontmatter('Just some text without frontmatter'),
    ).toThrow('No valid frontmatter block found');
  });

  it('should throw when only opening delimiter is present', () => {
    expect(() => parseFrontmatter('---\nid: test\ntitle: Test')).toThrow(
      'No valid frontmatter block found',
    );
  });

  it('should throw on invalid YAML', () => {
    const raw = `---
id: test
title: [invalid yaml{{
---`;
    expect(() => parseFrontmatter(raw)).toThrow('Failed to parse YAML');
  });

  it('should throw when required field "id" is missing', () => {
    const raw = `---
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow('Missing required field: id');
  });

  it('should throw when required field "title" is missing', () => {
    const raw = `---
id: test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow(
      'Missing required field: title',
    );
  });

  it('should throw when difficulty has invalid value', () => {
    const raw = `---
id: test
title: Test
difficulty: expert
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow(
      'Must be one of "beginner", "intermediate", "advanced"',
    );
  });

  it('should throw when tags is not an array', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: not-an-array
points: 10
starter:
  html: starter.html
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow('Must be an array of strings');
  });

  it('should throw when points is not a number', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: "fifty"
starter:
  html: starter.html
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow('Must be a number');
  });

  it('should throw when starter is missing', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow(
      'Missing required field: starter',
    );
  });

  it('should throw when starter.html is missing', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  css: style.css
validators:
  - test
---`;
    expect(() => parseFrontmatter(raw)).toThrow('starter.html');
  });

  it('should throw when validators is missing', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
---`;
    expect(() => parseFrontmatter(raw)).toThrow(
      'Missing required field: validators',
    );
  });

  describe('solution field handling', () => {
    it('should not include solution in result when solution field is absent', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.solution).toBeUndefined();
    });

    it('should include solution in result when solution field has valid paths', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  html: solution/index.html
  css: solution/styles.css
validators:
  - test-validator
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.solution).toEqual({
        html: 'solution/index.html',
        css: 'solution/styles.css',
      });
    });

    it('should include only specified solution paths (partial solution)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  html: solution/index.html
validators:
  - test-validator
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.solution).toEqual({ html: 'solution/index.html' });
    });

    it('should throw when solution field is not an object (string)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution: "not-an-object"
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution": Must be an object mapping file types to paths.',
      );
    });

    it('should throw when solution field is not an object (array)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  - html: solution/index.html
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution": Must be an object mapping file types to paths.',
      );
    });

    it('should throw when solution.html is not a string', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  html: 123
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution.html": Must be a string (file path) if provided.',
      );
    });

    it('should throw when solution.css is not a string', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  css: true
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution.css": Must be a string (file path) if provided.',
      );
    });

    it('should throw when solution.js is not a string', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  js: 42
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution.js": Must be a string (file path) if provided.',
      );
    });

    it('should throw when solution.vtt is not a string', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
solution:
  vtt: false
validators:
  - test-validator
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "solution.vtt": Must be a string (file path) if provided.',
      );
    });
  });

  describe('discussionUrl handling', () => {
    it('should accept frontmatter with a valid discussionUrl and return it correctly', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/42'
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.discussionUrl).toBe(
        'https://github.com/d-koppenhagen/practica11y/discussions/42',
      );
    });

    it('should return undefined for discussionUrl when the field is omitted', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.discussionUrl).toBeUndefined();
    });

    it('should treat empty string discussionUrl as absent (returns undefined)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
discussionUrl: ''
---

Body`;

      const result = parseFrontmatter(raw);
      expect(result.discussionUrl).toBeUndefined();
    });

    it('should throw error when discussionUrl is not a string (number)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
discussionUrl: 12345
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "discussionUrl": Must be a string.',
      );
    });

    it('should throw error when discussionUrl is not a string (boolean)', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
discussionUrl: true
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "discussionUrl": Must be a string.',
      );
    });

    it('should throw error when discussionUrl is not a well-formed URL', () => {
      const raw = `---
id: test
title: Test
difficulty: beginner
tags:
  - semantics
points: 50
starter:
  html: starter.html
validators:
  - test-validator
discussionUrl: 'not-a-valid-url'
---

Body`;

      expect(() => parseFrontmatter(raw)).toThrow(
        'Invalid field "discussionUrl": Must be a well-formed URL.',
      );
    });
  });
});

describe('parseMarkdownBody', () => {
  it('should extract body content after closing frontmatter delimiter', () => {
    const result = parseMarkdownBody(VALID_FRONTMATTER);
    expect(result).toBe('# Challenge Description\n\nFix the clickable div.');
  });

  it('should return empty string for empty input', () => {
    expect(parseMarkdownBody('')).toBe('');
  });

  it('should return full content when no frontmatter delimiters are present', () => {
    const raw = 'Just some markdown content';
    expect(parseMarkdownBody(raw)).toBe('Just some markdown content');
  });

  it('should handle body with additional --- in content', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---

Some content

---

More content after horizontal rule`;

    const result = parseMarkdownBody(raw);
    expect(result).toContain('Some content');
    expect(result).toContain('---');
    expect(result).toContain('More content after horizontal rule');
  });

  it('should trim whitespace from extracted body', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---


  Body with surrounding whitespace

`;

    const result = parseMarkdownBody(raw);
    expect(result).toBe('Body with surrounding whitespace');
  });

  it('should return empty string when body is only whitespace', () => {
    const raw = `---
id: test
title: Test
difficulty: beginner
tags: []
points: 10
starter:
  html: starter.html
validators:
  - test
---

`;

    const result = parseMarkdownBody(raw);
    expect(result).toBe('');
  });
});
