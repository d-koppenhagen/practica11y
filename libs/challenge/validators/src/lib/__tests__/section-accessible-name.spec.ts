import { describe, it, expect } from 'vitest';
import { sectionAccessibleName } from '../section-accessible-name';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('sectionAccessibleName', () => {
  it('fails when section has no aria-label or aria-labelledby', () => {
    const doc = createDoc('<section><h2>Content</h2></section>');
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('role="generic"');
  });

  it('fails for multiple unlabeled sections', () => {
    const doc = createDoc(
      '<section><h2>A</h2></section><section><h2>B</h2></section>',
    );
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('2 <section>');
  });

  it('passes when section has aria-label', () => {
    const doc = createDoc(
      '<section aria-label="Newsletter"><h2>Content</h2></section>',
    );
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('passes when section has aria-labelledby', () => {
    const doc = createDoc(
      '<section aria-labelledby="heading"><h2 id="heading">Content</h2></section>',
    );
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('passes when no sections are present', () => {
    const doc = createDoc('<div><h2>Content</h2></div>');
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('reports only unlabeled sections in a mixed set', () => {
    const doc = createDoc(
      '<section aria-label="Good"><h2>A</h2></section><section><h2>B</h2></section>',
    );
    const result = sectionAccessibleName.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('1 <section>');
  });
});
