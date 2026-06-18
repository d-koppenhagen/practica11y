import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FocusAnalysis } from './focus';

describe('FocusAnalysis', () => {
  let service: FocusAnalysis;
  let container: HTMLElement;

  beforeEach(() => {
    service = new FocusAnalysis();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('identifies focus traps', () => {
    it('should identify elements with aria-modal="true" as focus traps', () => {
      container.innerHTML = `
        <div aria-modal="true" role="dialog" id="modal">
          <button>Close</button>
        </div>
      `;

      const result = service.analyze(document);

      expect(result.focusTraps).toContain('#modal');
    });

    it('should identify elements with role="dialog" as focus traps', () => {
      container.innerHTML = `
        <div role="dialog" id="dialog-box">
          <p>Dialog content</p>
        </div>
      `;

      const result = service.analyze(document);

      expect(result.focusTraps).toContain('#dialog-box');
    });

    it('should return empty array when no focus traps exist', () => {
      container.innerHTML = `<p>No traps here</p>`;

      const result = service.analyze(document);

      expect(result.focusTraps).toHaveLength(0);
    });

    it('should identify multiple focus traps', () => {
      container.innerHTML = `
        <div role="dialog" id="dialog1">First</div>
        <div aria-modal="true" id="modal1">Second</div>
      `;

      const result = service.analyze(document);

      expect(result.focusTraps).toHaveLength(2);
      expect(result.focusTraps).toContain('#dialog1');
      expect(result.focusTraps).toContain('#modal1');
    });
  });

  describe('detects hidden focusable elements', () => {
    it('should detect focusable elements with hidden attribute', () => {
      container.innerHTML = `
        <button hidden id="hidden-btn">Hidden</button>
        <button id="visible-btn">Visible</button>
      `;

      const result = service.analyze(document);

      expect(result.hiddenFocusable).toContain('#hidden-btn');
      expect(result.hiddenFocusable).not.toContain('#visible-btn');
    });

    it('should detect focusable elements with aria-hidden="true"', () => {
      container.innerHTML = `
        <input type="text" aria-hidden="true" id="aria-hidden-input">
      `;

      const result = service.analyze(document);

      expect(result.hiddenFocusable).toContain('#aria-hidden-input');
    });

    it('should return empty array when no hidden focusable elements exist', () => {
      container.innerHTML = `
        <button>Visible</button>
        <input type="text">
      `;

      const result = service.analyze(document);

      expect(result.hiddenFocusable).toHaveLength(0);
    });
  });

  describe('determines focus order', () => {
    it('should determine focus order for visible, tabbable elements', () => {
      container.innerHTML = `
        <button id="btn1">First</button>
        <input id="input1" type="text">
        <a href="#" id="link1">Link</a>
      `;

      const result = service.analyze(document);

      expect(result.focusOrder).toContain('#btn1');
      expect(result.focusOrder).toContain('#input1');
      expect(result.focusOrder).toContain('#link1');
    });

    it('should respect positive tabindex ordering', () => {
      container.innerHTML = `
        <button id="btn-zero">Zero</button>
        <input id="input-two" tabindex="2" type="text">
        <a href="#" id="link-one" tabindex="1">One</a>
      `;

      const result = service.analyze(document);

      const oneIdx = result.focusOrder.indexOf('#link-one');
      const twoIdx = result.focusOrder.indexOf('#input-two');
      const zeroIdx = result.focusOrder.indexOf('#btn-zero');

      expect(oneIdx).toBeLessThan(twoIdx);
      expect(twoIdx).toBeLessThan(zeroIdx);
    });

    it('should exclude elements with tabindex=-1 from focus order', () => {
      container.innerHTML = `
        <button id="tabbable">Tabbable</button>
        <div tabindex="-1" id="not-tabbable">Not tabbable</div>
      `;

      const result = service.analyze(document);

      expect(result.focusOrder).toContain('#tabbable');
      expect(result.focusOrder).not.toContain('#not-tabbable');
    });

    it('should exclude hidden elements from focus order', () => {
      container.innerHTML = `
        <button id="visible">Visible</button>
        <button hidden id="hidden">Hidden</button>
      `;

      const result = service.analyze(document);

      expect(result.focusOrder).toContain('#visible');
      expect(result.focusOrder).not.toContain('#hidden');
    });
  });

  describe('empty document', () => {
    it('should return empty results for a document with no interactive elements', () => {
      container.innerHTML = `<p>Just text, no interactive elements</p>`;

      const result = service.analyze(document);

      expect(result.focusTraps).toHaveLength(0);
      expect(result.hiddenFocusable).toHaveLength(0);
      expect(result.focusOrder).toHaveLength(0);
    });
  });
});
