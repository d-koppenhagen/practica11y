import { describe, it, expect, afterEach } from 'vitest';
import { focusTrapImplemented } from '../focus-trap-implemented';

describe('focus-trap-implemented', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "focus-trap-implemented"', async () => {
    expect(focusTrapImplemented.id).toBe('focus-trap-implemented');
  });

  describe('valid focus trap → pass', () => {
    it('should pass when dialog has role, aria-modal, aria-labelledby, and focusable elements', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Settings</h2>
          <button>Close</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when dialog uses aria-label instead of aria-labelledby', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-label="Settings dialog">
          <input type="text" />
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass with a native <dialog> element', async () => {
      document.body.innerHTML = `
        <dialog aria-modal="true" aria-label="Confirm action">
          <button>OK</button>
          <button>Cancel</button>
        </dialog>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when dialog contains multiple focusable elements', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-labelledby="title">
          <h2 id="title">Form</h2>
          <input type="text" />
          <select><option>Option</option></select>
          <textarea></textarea>
          <button>Submit</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when focusable element uses tabindex', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-label="Custom dialog">
          <div tabindex="0">Focusable div</div>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('missing dialog → fail', () => {
    it('should fail when no dialog element exists', async () => {
      document.body.innerHTML = `
        <div class="modal">
          <button>Close</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No dialog element found');
    });
  });

  describe('missing aria-modal → fail', () => {
    it('should fail when dialog lacks aria-modal="true"', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-label="Settings">
          <button>Close</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('aria-modal="true"');
    });
  });

  describe('missing accessible name → fail', () => {
    it('should fail when dialog has no aria-label or aria-labelledby', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true">
          <button>Close</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('accessible name');
    });

    it('should fail when aria-labelledby references a non-existent element', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-labelledby="nonexistent">
          <button>Close</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('nonexistent');
    });
  });

  describe('no focusable elements → fail', () => {
    it('should fail when dialog contains no focusable elements', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-label="Empty dialog">
          <p>Just text, no interactive elements</p>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('no focusable elements');
    });

    it('should not count disabled buttons as focusable', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-label="Dialog">
          <button disabled>Disabled</button>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('no focusable elements');
    });

    it('should not count tabindex="-1" as focusable', async () => {
      document.body.innerHTML = `
        <div role="dialog" aria-modal="true" aria-label="Dialog">
          <div tabindex="-1">Not tabbable</div>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('no focusable elements');
    });
  });

  describe('multiple issues → fail with all reported', () => {
    it('should report multiple issues at once', async () => {
      document.body.innerHTML = `
        <div role="dialog">
          <p>No focusable elements, no aria-modal, no name</p>
        </div>
      `;

      const result = await focusTrapImplemented.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('3 issue(s)');
    });
  });
});
