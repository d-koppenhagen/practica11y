import { TestBed } from '@angular/core/testing';
import { LayoutStore } from '@practica11y/util';

import { ShellLayout } from './shell-layout';

describe('ShellLayout resize clamping', () => {
  let service: ShellLayout;
  let layoutStore: LayoutStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShellLayout],
    });

    layoutStore = TestBed.inject(LayoutStore);
    service = TestBed.inject(ShellLayout);
  });

  describe('resizeCol1', () => {
    it('should update column widths correctly with a small positive delta', () => {
      // Start with equal columns [3, 3, 3], grid width 900px
      layoutStore.setColWidths([3, 3, 3]);

      // Positive delta of 100px moves col1 border to the right
      // frDelta = (100 / 900) * 9 = 1
      // newL = 3 + 1 = 4, newM = 3 - 1 = 2, r stays 3
      service.resizeCol1(100, 900);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeCloseTo(4, 5);
      expect(m).toBeCloseTo(2, 5);
      expect(r).toBeCloseTo(3, 5);
    });

    it('should clamp to 0.5fr minimum when delta would push left column below threshold', () => {
      // Start with left column near minimum [1, 3, 3], grid width 700px
      layoutStore.setColWidths([1, 3, 3]);

      // Large negative delta: -500px
      // frDelta = (-500 / 700) * 7 = -5
      // newL = max(0.5, 1 + (-5)) = max(0.5, -4) = 0.5
      // newM = max(0.5, 3 - (-5)) = max(0.5, 8) = 8
      service.resizeCol1(-500, 700);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBe(0.5);
      expect(m).toBeGreaterThanOrEqual(0.5);
      expect(r).toBeCloseTo(3, 5);
    });

    it('should clamp middle column to 0.5fr minimum when positive delta is too large', () => {
      // Start with [3, 1, 3], grid width 700px
      layoutStore.setColWidths([3, 1, 3]);

      // Large positive delta: 500px
      // frDelta = (500 / 700) * 7 = 5
      // newL = max(0.5, 3 + 5) = 8
      // newM = max(0.5, 1 - 5) = max(0.5, -4) = 0.5
      service.resizeCol1(500, 700);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeGreaterThanOrEqual(0.5);
      expect(m).toBe(0.5);
      expect(r).toBeCloseTo(3, 5);
    });
  });

  describe('resizeCol2', () => {
    it('should update column widths correctly with a negative delta', () => {
      // Start with [3, 4, 4], grid width 1100px
      layoutStore.setColWidths([3, 4, 4]);

      // Negative delta of -100px moves col2 border to the left
      // frDelta = (-100 / 1100) * 11 = -1
      // newM = max(0.5, 4 + (-1)) = 3, newR = max(0.5, 4 - (-1)) = 5
      service.resizeCol2(-100, 1100);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeCloseTo(3, 5);
      expect(m).toBeCloseTo(3, 5);
      expect(r).toBeCloseTo(5, 5);
    });

    it('should clamp middle column to 0.5fr minimum when negative delta is too large', () => {
      // Start with [3, 1, 4], grid width 800px
      layoutStore.setColWidths([3, 1, 4]);

      // Large negative delta: -600px
      // frDelta = (-600 / 800) * 8 = -6
      // newM = max(0.5, 1 + (-6)) = max(0.5, -5) = 0.5
      // newR = max(0.5, 4 - (-6)) = max(0.5, 10) = 10
      service.resizeCol2(-600, 800);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeCloseTo(3, 5);
      expect(m).toBe(0.5);
      expect(r).toBeGreaterThanOrEqual(0.5);
    });

    it('should clamp right column to 0.5fr minimum when positive delta is too large', () => {
      // Start with [3, 4, 1], grid width 800px
      layoutStore.setColWidths([3, 4, 1]);

      // Large positive delta: 600px
      // frDelta = (600 / 800) * 8 = 6
      // newM = max(0.5, 4 + 6) = 10
      // newR = max(0.5, 1 - 6) = max(0.5, -5) = 0.5
      service.resizeCol2(600, 800);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeCloseTo(3, 5);
      expect(m).toBeGreaterThanOrEqual(0.5);
      expect(r).toBe(0.5);
    });
  });

  describe('resizeRow', () => {
    it('should update row heights correctly with a positive delta', () => {
      // Start with [1, 1], grid height 600px
      layoutStore.setRowHeights([1, 1]);

      // Positive delta of 100px moves row separator down
      // frDelta = (100 / 600) * 2 = 0.333...
      // newT = max(0.3, 1 + 0.333) = 1.333
      // newB = max(0.3, 1 - 0.333) = 0.667
      service.resizeRow(100, 600);

      const [t, b] = layoutStore.layout().rowHeights;
      expect(t).toBeCloseTo(1.333, 2);
      expect(b).toBeCloseTo(0.667, 2);
    });

    it('should clamp to 0.3fr minimum when delta would push bottom row below threshold', () => {
      // Start with [1, 0.5], grid height 600px
      layoutStore.setRowHeights([1, 0.5]);

      // Large positive delta: 400px
      // frDelta = (400 / 600) * 1.5 = 1.0
      // newT = max(0.3, 1 + 1) = 2
      // newB = max(0.3, 0.5 - 1) = max(0.3, -0.5) = 0.3
      service.resizeRow(400, 600);

      const [t, b] = layoutStore.layout().rowHeights;
      expect(t).toBeGreaterThanOrEqual(0.3);
      expect(b).toBe(0.3);
    });

    it('should clamp to 0.3fr minimum when delta would push top row below threshold', () => {
      // Start with [0.5, 1], grid height 600px
      layoutStore.setRowHeights([0.5, 1]);

      // Large negative delta: -400px
      // frDelta = (-400 / 600) * 1.5 = -1.0
      // newT = max(0.3, 0.5 + (-1)) = max(0.3, -0.5) = 0.3
      // newB = max(0.3, 1 - (-1)) = max(0.3, 2) = 2
      service.resizeRow(-400, 600);

      const [t, b] = layoutStore.layout().rowHeights;
      expect(t).toBe(0.3);
      expect(b).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe('extreme deltas', () => {
    it('should produce valid clamped results with a very large positive column delta', () => {
      layoutStore.setColWidths([2, 2, 2]);

      // Extreme positive delta: 10000px, grid width 600px
      // frDelta = (10000 / 600) * 6 = 100
      service.resizeCol1(10000, 600);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeGreaterThanOrEqual(0.5);
      expect(m).toBe(0.5);
      expect(r).toBeCloseTo(2, 5);
    });

    it('should produce valid clamped results with a very large negative column delta', () => {
      layoutStore.setColWidths([2, 2, 2]);

      // Extreme negative delta: -10000px, grid width 600px
      service.resizeCol2(-10000, 600);

      const [l, m, r] = layoutStore.layout().colWidths;
      expect(l).toBeCloseTo(2, 5);
      expect(m).toBe(0.5);
      expect(r).toBeGreaterThanOrEqual(0.5);
    });

    it('should produce valid clamped results with a very large positive row delta', () => {
      layoutStore.setRowHeights([1, 1]);

      // Extreme positive delta: 10000px, grid height 400px
      service.resizeRow(10000, 400);

      const [t, b] = layoutStore.layout().rowHeights;
      expect(t).toBeGreaterThanOrEqual(0.3);
      expect(b).toBe(0.3);
    });

    it('should produce valid clamped results with a very large negative row delta', () => {
      layoutStore.setRowHeights([1, 1]);

      // Extreme negative delta: -10000px, grid height 400px
      service.resizeRow(-10000, 400);

      const [t, b] = layoutStore.layout().rowHeights;
      expect(t).toBe(0.3);
      expect(b).toBeGreaterThanOrEqual(0.3);
    });
  });
});
