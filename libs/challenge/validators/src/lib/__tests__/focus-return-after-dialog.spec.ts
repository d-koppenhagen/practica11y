import { describe, it, expect } from 'vitest';
import { focusReturnAfterDialog } from '../focus-return-after-dialog';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('focusReturnAfterDialog', () => {
  const baseHtml = `
    <button class="delete-btn">Delete</button>
    <div id="confirm-dialog" role="dialog" aria-modal="true" hidden>
      <button id="confirm-btn">OK</button>
      <button id="cancel-btn">Cancel</button>
    </div>
  `;

  it('fails when no trigger reference is saved and no focus call exists', () => {
    const starterJs = `
      const dialog = document.getElementById('confirm-dialog');
      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          dialog.hidden = false;
          confirmBtn.focus();
        });
      });
      confirmBtn.addEventListener('click', () => { dialog.hidden = true; });
      cancelBtn.addEventListener('click', () => { dialog.hidden = true; });
    `;
    const doc = createDoc(`${baseHtml}<script>${starterJs}</script>`);
    const result = focusReturnAfterDialog.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('No trigger element reference is saved');
    expect(result.details).toContain('No .focus() call found');
  });

  it('passes when trigger is saved and focus is restored', () => {
    const solutionJs = `
      const dialog = document.getElementById('confirm-dialog');
      let triggerElement = null;

      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          triggerElement = btn;
          dialog.hidden = false;
          confirmBtn.focus();
        });
      });

      function closeDialog() {
        dialog.hidden = true;
        if (triggerElement) {
          triggerElement.focus();
          triggerElement = null;
        }
      }

      confirmBtn.addEventListener('click', () => { closeDialog(); });
      cancelBtn.addEventListener('click', () => { closeDialog(); });
    `;
    const doc = createDoc(`${baseHtml}<script>${solutionJs}</script>`);
    const result = focusReturnAfterDialog.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('passes when trigger is saved via document.activeElement', () => {
    const js = `
      const dialog = document.getElementById('confirm-dialog');
      let trigger = null;

      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          trigger = document.activeElement;
          dialog.hidden = false;
        });
      });

      function closeDialog() {
        dialog.hidden = true;
        trigger.focus();
      }
    `;
    const doc = createDoc(`${baseHtml}<script>${js}</script>`);
    const result = focusReturnAfterDialog.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('passes when trigger is saved via e.target', () => {
    const js = `
      const dialog = document.getElementById('confirm-dialog');
      let opener = null;

      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          opener = e.target;
          dialog.hidden = false;
        });
      });

      function closeDialog() {
        dialog.hidden = true;
        opener.focus();
      }
    `;
    const doc = createDoc(`${baseHtml}<script>${js}</script>`);
    const result = focusReturnAfterDialog.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('fails when trigger is saved but no focus call is made', () => {
    const js = `
      const dialog = document.getElementById('confirm-dialog');
      let triggerElement = null;

      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          triggerElement = btn;
          dialog.hidden = false;
        });
      });

      confirmBtn.addEventListener('click', () => { dialog.hidden = true; });
    `;
    const doc = createDoc(`${baseHtml}<script>${js}</script>`);
    const result = focusReturnAfterDialog.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('No .focus() call found');
  });

  it('uses sourceHtml fallback when no scripts are in DOM', () => {
    const solutionJs = `
      let triggerElement = null;
      triggerElement = btn;
      function closeDialog() {
        dialog.hidden = true;
        triggerElement.focus();
      }
    `;
    const doc = createDoc(baseHtml);
    const result = focusReturnAfterDialog.validate(doc, {
      sourceHtml: solutionJs,
    });
    expect(result.passed).toBe(true);
  });
});
