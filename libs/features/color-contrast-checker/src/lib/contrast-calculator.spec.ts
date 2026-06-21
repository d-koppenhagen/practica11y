import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  formatContrastRatio,
  getWcagConformance,
  isLargeText,
  rgbToHex,
} from './contrast-calculator';

describe('calculateContrastRatio', () => {
  it('should return 21 for black on white', () => {
    const ratio = calculateContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1 for white on white', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('should return ~4.48 for #777777 on #FFFFFF', () => {
    const ratio = calculateContrastRatio('#777777', '#FFFFFF');
    expect(ratio).toBeCloseTo(4.48, 1);
  });
});

describe('formatContrastRatio', () => {
  it('should format 21 as "21.00:1"', () => {
    expect(formatContrastRatio(21)).toBe('21.00:1');
  });

  it('should format 4.5 as "4.50:1"', () => {
    expect(formatContrastRatio(4.5)).toBe('4.50:1');
  });

  it('should format 1.123456 as "1.12:1" (truncated to 2 decimals)', () => {
    expect(formatContrastRatio(1.123456)).toBe('1.12:1');
  });

  it('should format 3.455 as "3.46:1" (half-up rounding)', () => {
    expect(formatContrastRatio(3.455)).toBe('3.46:1');
  });
});

describe('getWcagConformance', () => {
  it('should pass AA normal at ratio 4.5', () => {
    const result = getWcagConformance(4.5);
    expect(result.aaNormal).toBe(true);
  });

  it('should fail AA normal at ratio 4.49', () => {
    const result = getWcagConformance(4.49);
    expect(result.aaNormal).toBe(false);
  });

  it('should pass AA large at ratio 3.0', () => {
    const result = getWcagConformance(3.0);
    expect(result.aaLarge).toBe(true);
  });

  it('should fail AA large at ratio 2.99', () => {
    const result = getWcagConformance(2.99);
    expect(result.aaLarge).toBe(false);
  });

  it('should pass AAA normal at ratio 7.0', () => {
    const result = getWcagConformance(7.0);
    expect(result.aaaNormal).toBe(true);
  });

  it('should fail AAA normal at ratio 6.99', () => {
    const result = getWcagConformance(6.99);
    expect(result.aaaNormal).toBe(false);
  });
});

describe('isLargeText', () => {
  it('should return true for 24px at weight 400', () => {
    expect(isLargeText(24, 400)).toBe(true);
  });

  it('should return false for 23.99px at weight 400', () => {
    expect(isLargeText(23.99, 400)).toBe(false);
  });

  it('should return true for 18.66px at weight 700', () => {
    expect(isLargeText(18.66, 700)).toBe(true);
  });

  it('should return false for 18.66px at weight 699', () => {
    expect(isLargeText(18.66, 699)).toBe(false);
  });

  it('should return false for 18.65px at weight 700', () => {
    expect(isLargeText(18.65, 700)).toBe(false);
  });
});

describe('rgbToHex', () => {
  it('should convert rgb(0, 0, 0) to #000000', () => {
    expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
  });

  it('should convert rgb(255, 255, 255) to #FFFFFF', () => {
    expect(rgbToHex('rgb(255, 255, 255)')).toBe('#FFFFFF');
  });

  it('should convert rgb(26, 43, 60) to #1A2B3C', () => {
    expect(rgbToHex('rgb(26, 43, 60)')).toBe('#1A2B3C');
  });
});
