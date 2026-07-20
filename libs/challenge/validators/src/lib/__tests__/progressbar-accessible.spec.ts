import { describe, it, expect } from 'vitest';
import { progressbarAccessible } from '../progressbar-accessible';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
}

describe('progressbarAccessible', () => {
  describe('native <progress> element', () => {
    it('passes with fully accessible native progress element', () => {
      const doc = createDoc(`
        <progress value="65" max="100" aria-label="File upload progress">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(true);
    });

    it('fails when no progress indicator exists', () => {
      const doc = createDoc(`
        <div class="progress-track">
          <div class="progress-fill" style="width: 65%"></div>
        </div>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain(
        'No accessible progress indicator found',
      );
    });

    it('fails when value attribute is missing', () => {
      const doc = createDoc(`
        <progress max="100" aria-label="Upload">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('missing the "value" attribute');
    });

    it('fails when max attribute is missing', () => {
      const doc = createDoc(`
        <progress value="65" aria-label="Upload">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('missing the "max" attribute');
    });

    it('fails when aria-label is missing', () => {
      const doc = createDoc(`
        <progress value="65" max="100">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('no accessible label');
    });

    it('passes with aria-labelledby instead of aria-label', () => {
      const doc = createDoc(`
        <span id="progress-label">File upload progress</span>
        <progress value="65" max="100" aria-labelledby="progress-label">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(true);
    });
  });

  describe('role="progressbar" element', () => {
    it('passes with fully accessible ARIA progressbar', () => {
      const doc = createDoc(`
        <div role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress">
          <div style="width: 65%"></div>
        </div>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(true);
    });

    it('fails when aria-valuenow is missing', () => {
      const doc = createDoc(`
        <div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Upload">
          <div style="width: 65%"></div>
        </div>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('missing "aria-valuenow"');
    });

    it('fails when aria-valuemin is missing', () => {
      const doc = createDoc(`
        <div role="progressbar" aria-valuenow="65" aria-valuemax="100" aria-label="Upload">
          <div style="width: 65%"></div>
        </div>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('missing "aria-valuemin"');
    });

    it('fails when aria-valuemax is missing', () => {
      const doc = createDoc(`
        <div role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-label="Upload">
          <div style="width: 65%"></div>
        </div>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('missing "aria-valuemax"');
    });

    it('fails when accessible label is missing', () => {
      const doc = createDoc(`
        <div role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">
          <div style="width: 65%"></div>
        </div>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('no accessible label');
    });
  });

  describe('visible text equivalent', () => {
    it('fails when no visible percentage text is present', () => {
      const doc = createDoc(`
        <progress value="65" max="100" aria-label="Upload progress">65%</progress>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('No visible text equivalent');
    });

    it('passes with percentage text outside the progress element', () => {
      const doc = createDoc(`
        <progress value="65" max="100" aria-label="Upload progress">65%</progress>
        <span>65%</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(true);
    });

    it('recognizes various percentage formats', () => {
      const doc = createDoc(`
        <progress value="100" max="100" aria-label="Upload progress">100%</progress>
        <span>100 %</span>
      `);
      const result = progressbarAccessible.validate(doc);
      expect(result.passed).toBe(true);
    });
  });
});
