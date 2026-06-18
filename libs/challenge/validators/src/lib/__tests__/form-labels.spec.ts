import { describe, it, expect, afterEach } from 'vitest';
import { formLabels } from '../form-labels';

describe('form-labels', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "form-labels"', () => {
    expect(formLabels.id).toBe('form-labels');
  });

  describe('labeled inputs → pass', () => {
    it('should pass when all inputs have labels via for/id', () => {
      document.body.innerHTML = `
        <label for="name">Name</label>
        <input type="text" id="name">
        <label for="email">Email</label>
        <input type="email" id="email">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when inputs have aria-label', () => {
      document.body.innerHTML = `
        <input type="text" aria-label="Search">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when inputs are wrapped in label', () => {
      document.body.innerHTML = `
        <label>
          Username
          <input type="text">
        </label>
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when inputs have aria-labelledby', () => {
      document.body.innerHTML = `
        <span id="label-ref">Password</span>
        <input type="password" aria-labelledby="label-ref">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when inputs have title attribute', () => {
      document.body.innerHTML = `
        <input type="text" title="Enter your name">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('unlabeled inputs → fail', () => {
    it('should fail when an input has no label', () => {
      document.body.innerHTML = `
        <input type="text">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
      expect(result.message).toContain('missing');
    });

    it('should fail when some inputs are unlabeled', () => {
      document.body.innerHTML = `
        <label for="ok">OK</label>
        <input type="text" id="ok">
        <input type="text" id="no-label">
        <select id="no-label-select"><option>A</option></select>
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2');
    });

    it('should detect unlabeled textarea', () => {
      document.body.innerHTML = `
        <textarea></textarea>
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should detect unlabeled select', () => {
      document.body.innerHTML = `
        <select><option>Choose</option></select>
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(false);
    });
  });

  describe('no inputs → pass', () => {
    it('should pass when there are no form fields', () => {
      document.body.innerHTML = `
        <p>No form fields here</p>
        <div>Just content</div>
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No form fields');
    });

    it('should ignore hidden inputs', () => {
      document.body.innerHTML = `
        <input type="hidden" name="csrf">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should ignore submit/button/reset inputs', () => {
      document.body.innerHTML = `
        <input type="submit" value="Submit">
        <input type="button" value="Click">
        <input type="reset" value="Reset">
      `;

      const result = formLabels.validate(document);

      expect(result.passed).toBe(true);
    });
  });
});
