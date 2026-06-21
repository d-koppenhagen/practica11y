export interface WcagConformance {
  readonly aaNormal: boolean; // ratio >= 4.5
  readonly aaLarge: boolean; // ratio >= 3.0
  readonly aaaNormal: boolean; // ratio >= 7.0
  readonly aaaLarge: boolean; // ratio >= 4.5
}

export interface ColorPickResult {
  readonly foregroundColor: string;
  readonly backgroundColor: string;
  readonly fontSizePx: number;
  readonly fontWeight: number;
}

export interface RgbaColor {
  readonly r: number; // 0-255
  readonly g: number; // 0-255
  readonly b: number; // 0-255
  readonly a: number; // 0-1
}
