import Color from 'colorjs.io';
import { WcagConformance } from '@practica11y/types';

/**
 * Calculates the WCAG 2.1 contrast ratio between two colors.
 * Uses colorjs.io's contrast function with the WCAG21 algorithm.
 * @returns A value between 1 and 21 (inclusive).
 */
export function calculateContrastRatio(fg: string, bg: string): number {
  const fgColor = new Color(fg);
  const bgColor = new Color(bg);
  return Math.abs(fgColor.contrast(bgColor, 'WCAG21'));
}

/**
 * Formats a contrast ratio as "X.XX:1" with standard half-up rounding to 2 decimals.
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Converts a CSS color string (e.g. "rgb(0, 0, 0)") to uppercase 6-digit hex format (e.g. "#000000").
 */
export function rgbToHex(cssColor: string): string {
  const color = new Color(cssColor).to('srgb');
  const [r, g, b] = color.coords.map((c) =>
    Math.round(Math.min(255, Math.max(0, (c ?? 0) * 255)))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Determines if text qualifies as "large text" per WCAG 2.1 definition.
 * Large text is at least 24px, or at least 18.66px AND bold (font-weight >= 700).
 */
export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
}

/**
 * Checks all four WCAG 2.1 contrast conformance thresholds.
 */
export function getWcagConformance(ratio: number): WcagConformance {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge: ratio >= 4.5,
  };
}
