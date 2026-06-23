import { TestBed } from '@angular/core/testing';
import { ShellLayout } from './shell-layout';
import { LayoutStore } from '@practica11y/util';

describe('ShellLayout', () => {
  let shellLayout: ShellLayout;
  let layoutStore: LayoutStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShellLayout],
    });

    layoutStore = TestBed.inject(LayoutStore);
    shellLayout = TestBed.inject(ShellLayout);
  });

  describe('col1SeparatorPercent', () => {
    it('should return 33 for equal column widths [1, 1, 1]', () => {
      layoutStore.setColWidths([1, 1, 1]);
      expect(shellLayout.col1SeparatorPercent()).toBe(33);
    });

    it('should return 50 for column widths [2, 1, 1]', () => {
      layoutStore.setColWidths([2, 1, 1]);
      expect(shellLayout.col1SeparatorPercent()).toBe(50);
    });

    it('should return 25 for column widths [1, 2, 1]', () => {
      layoutStore.setColWidths([1, 2, 1]);
      expect(shellLayout.col1SeparatorPercent()).toBe(25);
    });

    it('should return 75 for column widths [3, 0.5, 0.5]', () => {
      layoutStore.setColWidths([3, 0.5, 0.5]);
      expect(shellLayout.col1SeparatorPercent()).toBe(75);
    });

    it('should round Math.round(33.33) to 33 for [1, 1, 1]', () => {
      layoutStore.setColWidths([1, 1, 1]);
      // 1 / (1+1+1) * 100 = 33.333... → Math.round → 33
      expect(shellLayout.col1SeparatorPercent()).toBe(
        Math.round((1 / 3) * 100),
      );
    });
  });

  describe('col2SeparatorPercent', () => {
    it('should return 50 for equal column widths [1, 1, 1]', () => {
      layoutStore.setColWidths([1, 1, 1]);
      // middle / (middle + right) = 1 / (1+1) = 50%
      expect(shellLayout.col2SeparatorPercent()).toBe(50);
    });

    it('should return 75 for column widths [1, 3, 1]', () => {
      layoutStore.setColWidths([1, 3, 1]);
      // 3 / (3+1) = 75%
      expect(shellLayout.col2SeparatorPercent()).toBe(75);
    });

    it('should return 25 for column widths [1, 1, 3]', () => {
      layoutStore.setColWidths([1, 1, 3]);
      // 1 / (1+3) = 25%
      expect(shellLayout.col2SeparatorPercent()).toBe(25);
    });

    it('should return 67 for column widths [1, 2, 1]', () => {
      layoutStore.setColWidths([1, 2, 1]);
      // 2 / (2+1) = 66.666... → Math.round → 67
      expect(shellLayout.col2SeparatorPercent()).toBe(67);
    });

    it('should be independent of left column width', () => {
      layoutStore.setColWidths([5, 2, 2]);
      // 2 / (2+2) = 50%
      expect(shellLayout.col2SeparatorPercent()).toBe(50);

      layoutStore.setColWidths([0.5, 2, 2]);
      expect(shellLayout.col2SeparatorPercent()).toBe(50);
    });
  });

  describe('rowSeparatorPercent', () => {
    it('should return 50 for equal row heights [1, 1]', () => {
      layoutStore.setRowHeights([1, 1]);
      expect(shellLayout.rowSeparatorPercent()).toBe(50);
    });

    it('should return 75 for row heights [3, 1]', () => {
      layoutStore.setRowHeights([3, 1]);
      expect(shellLayout.rowSeparatorPercent()).toBe(75);
    });

    it('should return 25 for row heights [1, 3]', () => {
      layoutStore.setRowHeights([1, 3]);
      expect(shellLayout.rowSeparatorPercent()).toBe(25);
    });

    it('should return 67 for row heights [2, 1]', () => {
      layoutStore.setRowHeights([2, 1]);
      // 2 / (2+1) = 66.666... → Math.round → 67
      expect(shellLayout.rowSeparatorPercent()).toBe(67);
    });

    it('should round correctly for row heights [1, 2]', () => {
      layoutStore.setRowHeights([1, 2]);
      // 1 / (1+2) = 33.333... → Math.round → 33
      expect(shellLayout.rowSeparatorPercent()).toBe(33);
    });
  });

  describe('rounding behavior', () => {
    it('should use Math.round for col1SeparatorPercent', () => {
      // 1/6 * 100 = 16.666... → 17
      layoutStore.setColWidths([1, 2, 3]);
      expect(shellLayout.col1SeparatorPercent()).toBe(17);
    });

    it('should use Math.round for col2SeparatorPercent', () => {
      // 2/5 * 100 = 40 (exact)
      layoutStore.setColWidths([1, 2, 3]);
      expect(shellLayout.col2SeparatorPercent()).toBe(40);
    });

    it('should use Math.round for rowSeparatorPercent', () => {
      // 1/6 * 100 = 16.666... → 17
      layoutStore.setRowHeights([1, 5]);
      expect(shellLayout.rowSeparatorPercent()).toBe(17);
    });
  });
});
