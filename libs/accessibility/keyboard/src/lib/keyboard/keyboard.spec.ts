import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyboardAnalysis } from './keyboard';

describe('KeyboardAnalysis', () => {
  let service: KeyboardAnalysis;
  let container: HTMLElement;

  beforeEach(() => {
    service = new KeyboardAnalysis();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('identifies focusable elements', () => {
    it('should identify native focusable elements (button, input, a[href], select, textarea)', () => {
      container.innerHTML = `
        <button>Click me</button>
        <input type="text">
        <a href="/link">Link</a>
        <select><option>opt</option></select>
        <textarea></textarea>
      `;

      const result = service.analyze(document);

      expect(result.focusableElements).toHaveLength(5);
      expect(result.focusableElements.map((el) => el.role)).toEqual(
        expect.arrayContaining([
          'button',
          'textbox',
          'link',
          'combobox',
          'textbox',
        ]),
      );
    });

    it('should identify elements with explicit tabindex', () => {
      container.innerHTML = `
        <div tabindex="0" id="focusable-div">Custom focusable</div>
        <span tabindex="-1" id="programmatic-focus">Programmatic only</span>
      `;

      const result = service.analyze(document);

      const selectors = result.focusableElements.map((el) => el.selector);
      expect(selectors).toContain('#focusable-div');
      expect(selectors).toContain('#programmatic-focus');
    });

    it('should not include disabled elements', () => {
      container.innerHTML = `
        <button disabled>Disabled</button>
        <input type="text" disabled>
        <button>Enabled</button>
      `;

      const result = service.analyze(document);

      const buttons = result.focusableElements.filter(
        (el) => el.role === 'button',
      );
      expect(buttons).toHaveLength(1);
    });

    it('should mark native interactive elements as interactive', () => {
      container.innerHTML = `<button id="btn">Click</button>`;

      const result = service.analyze(document);

      const btn = result.focusableElements.find((el) => el.selector === '#btn');
      expect(btn?.isInteractive).toBe(true);
    });

    it('should mark non-interactive elements with tabindex as not interactive', () => {
      container.innerHTML = `<div tabindex="0" id="div-focus">Text</div>`;

      const result = service.analyze(document);

      const div = result.focusableElements.find(
        (el) => el.selector === '#div-focus',
      );
      expect(div?.isInteractive).toBe(false);
    });
  });

  describe('calculates tab order', () => {
    it('should order elements with positive tabindex before tabindex=0', () => {
      container.innerHTML = `
        <button id="btn-zero">Zero</button>
        <input id="input-two" tabindex="2">
        <a href="#" id="link-one" tabindex="1">One</a>
      `;

      const result = service.analyze(document);

      const tabOrder = result.tabOrder;
      const oneIdx = tabOrder.indexOf('#link-one');
      const twoIdx = tabOrder.indexOf('#input-two');
      const zeroIdx = tabOrder.indexOf('#btn-zero');

      expect(oneIdx).toBeLessThan(twoIdx);
      expect(twoIdx).toBeLessThan(zeroIdx);
    });

    it('should exclude elements with tabindex=-1 from tab order', () => {
      container.innerHTML = `
        <button id="btn">Tabbable</button>
        <div tabindex="-1" id="not-tabbable">Not in tab order</div>
      `;

      const result = service.analyze(document);

      expect(result.tabOrder).toContain('#btn');
      expect(result.tabOrder).not.toContain('#not-tabbable');
    });

    it('should maintain DOM order for elements with same tabindex (0)', () => {
      container.innerHTML = `
        <button id="first">First</button>
        <button id="second">Second</button>
        <button id="third">Third</button>
      `;

      const result = service.analyze(document);

      const firstIdx = result.tabOrder.indexOf('#first');
      const secondIdx = result.tabOrder.indexOf('#second');
      const thirdIdx = result.tabOrder.indexOf('#third');

      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });
  });

  describe('detects non-focusable interactive elements', () => {
    it('should detect elements with interactive role but no focusability', () => {
      container.innerHTML = `
        <div role="button" id="fake-button">Click me</div>
        <span role="link" id="fake-link">Link</span>
      `;

      const result = service.analyze(document);

      expect(result.nonFocusableInteractive).toContain('#fake-button');
      expect(result.nonFocusableInteractive).toContain('#fake-link');
    });

    it('should not flag elements with interactive role that have tabindex', () => {
      container.innerHTML = `
        <div role="button" tabindex="0" id="accessible-btn">OK</div>
      `;

      const result = service.analyze(document);

      expect(result.nonFocusableInteractive).not.toContain('#accessible-btn');
    });

    it('should not flag native interactive elements', () => {
      container.innerHTML = `<button id="native-btn">Native</button>`;

      const result = service.analyze(document);

      expect(result.nonFocusableInteractive).not.toContain('#native-btn');
    });

    it('should detect common interactive ARIA roles', () => {
      container.innerHTML = `
        <div role="tab" id="fake-tab">Tab</div>
        <div role="menuitem" id="fake-menu">Menu</div>
        <div role="checkbox" id="fake-check">Check</div>
      `;

      const result = service.analyze(document);

      expect(result.nonFocusableInteractive).toContain('#fake-tab');
      expect(result.nonFocusableInteractive).toContain('#fake-menu');
      expect(result.nonFocusableInteractive).toContain('#fake-check');
    });
  });

  describe('empty document', () => {
    it('should return empty results for a document with no interactive elements', () => {
      container.innerHTML = `<p>Just text</p>`;

      const result = service.analyze(document);

      expect(result.focusableElements).toHaveLength(0);
      expect(result.tabOrder).toHaveLength(0);
      expect(result.nonFocusableInteractive).toHaveLength(0);
    });
  });
});
