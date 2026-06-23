import { TestBed } from '@angular/core/testing';
import { LayoutStore } from '@practica11y/util';

import { ShellLayout } from './shell-layout';

describe('ShellLayout — flex collapse computation', () => {
  let layout: ShellLayout;
  let store: LayoutStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShellLayout],
    });

    layout = TestBed.inject(ShellLayout);
    store = TestBed.inject(LayoutStore);
  });

  describe('descriptionFlex', () => {
    it('should return "0 0 auto" when collapsed is true', () => {
      expect(layout.descriptionFlex(true)).toBe('0 0 auto');
    });

    it('should return column width as string when collapsed is false', () => {
      // Default colWidths are [3, 4, 4] — first column is 3
      expect(layout.descriptionFlex(false)).toBe('3');
    });

    it('should return updated column width after store change', () => {
      store.setColWidths([1.5, 2, 2]);
      expect(layout.descriptionFlex(false)).toBe('1.5');
    });
  });

  describe('topRowFlex', () => {
    it('should return "0 0 auto" when both editor and preview are collapsed', () => {
      expect(layout.topRowFlex(true, true)).toBe('0 0 auto');
    });

    it('should return row height fraction when only editor is expanded', () => {
      // Default rowHeights are [1, 1] — top row is 1
      expect(layout.topRowFlex(false, true)).toBe('1');
    });

    it('should return row height fraction when only preview is expanded', () => {
      expect(layout.topRowFlex(true, false)).toBe('1');
    });

    it('should return row height fraction when both are expanded', () => {
      expect(layout.topRowFlex(false, false)).toBe('1');
    });

    it('should return updated row height after store change', () => {
      store.setRowHeights([2.5, 1]);
      expect(layout.topRowFlex(false, false)).toBe('2.5');
    });
  });

  describe('bottomRowFlex', () => {
    it('should return "0 0 auto" when both tree and feedback are collapsed', () => {
      expect(layout.bottomRowFlex(true, true)).toBe('0 0 auto');
    });

    it('should return row height fraction when only tree is expanded', () => {
      // Default rowHeights are [1, 1] — bottom row is 1
      expect(layout.bottomRowFlex(false, true)).toBe('1');
    });

    it('should return row height fraction when only feedback is expanded', () => {
      expect(layout.bottomRowFlex(true, false)).toBe('1');
    });

    it('should return row height fraction when both are expanded', () => {
      expect(layout.bottomRowFlex(false, false)).toBe('1');
    });

    it('should return updated row height after store change', () => {
      store.setRowHeights([1, 3.7]);
      expect(layout.bottomRowFlex(false, false)).toBe('3.7');
    });
  });
});
