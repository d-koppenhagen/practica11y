import type { RgbaColor } from '@practica11y/types';
import type { ColorPickPayload } from './messaging';

/**
 * Parse a CSS rgb() or rgba() color string into an RgbaColor object.
 * Only handles the format returned by getComputedStyle:
 *   "rgb(r, g, b)" or "rgba(r, g, b, a)"
 */
export function parseRgba(cssColor: string): RgbaColor {
  const match = cssColor.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/,
  );
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Alpha-composite foreground over background using the "over" operator.
 * Returns a new RgbaColor with components clamped to valid ranges.
 */
export function alphaBlend(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  const outA = fg.a + bg.a * (1 - fg.a);

  if (outA === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const outR = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / outA;
  const outG = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / outA;
  const outB = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / outA;

  return {
    r: Math.round(Math.min(255, Math.max(0, outR))),
    g: Math.round(Math.min(255, Math.max(0, outG))),
    b: Math.round(Math.min(255, Math.max(0, outB))),
    a: Math.min(1, Math.max(0, outA)),
  };
}

/**
 * Walk up the DOM tree from the given element, collecting background colors
 * and alpha-blending them bottom-to-top. Falls back to white (#FFFFFF) if
 * no opaque ancestor is found.
 *
 * Returns the final opaque color as an "rgb(r, g, b)" string.
 */
export function resolveBackgroundColor(element: Element): string {
  const layers: RgbaColor[] = [];
  let current: Element | null = element;

  while (current) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;
    if (bgColor) {
      const parsed = parseRgba(bgColor);
      layers.push(parsed);
      // If this layer is fully opaque, no need to go further up
      if (parsed.a >= 1) {
        break;
      }
    }
    current = current.parentElement;
  }

  // Composite from bottom (last = deepest ancestor) to top (first = target element)
  // Start with white as the ultimate backdrop
  let result: RgbaColor = { r: 255, g: 255, b: 255, a: 1 };

  for (let i = layers.length - 1; i >= 0; i--) {
    result = alphaBlend(layers[i], result);
  }

  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

let currentHighlightedElement: Element | null = null;
let hoverListener: ((e: MouseEvent) => void) | null = null;
let clickListener: ((e: MouseEvent) => void) | null = null;

/**
 * Enter color picker mode: add hover highlight and click interception
 * to allow the user to pick an element for color extraction.
 */
export function enableColorPicker(): void {
  disableColorPicker();

  document.body.style.cursor = 'crosshair';

  hoverListener = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;

    // Remove highlight from previously hovered element
    if (
      currentHighlightedElement &&
      currentHighlightedElement !== target &&
      currentHighlightedElement instanceof HTMLElement
    ) {
      currentHighlightedElement.style.outline = '';
      currentHighlightedElement.style.cursor = '';
    }

    // Apply highlight to the new target
    if (target instanceof HTMLElement) {
      target.style.outline = '2px solid #007bff';
      target.style.cursor = 'crosshair';
    }
    currentHighlightedElement = target;
  };

  clickListener = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as Element | null;
    if (!target) return;

    const computedStyle = window.getComputedStyle(target);
    const foregroundColor = computedStyle.color;
    const backgroundColor = resolveBackgroundColor(target);
    const fontSizePx = parseFloat(computedStyle.fontSize);
    const fontWeight = parseInt(computedStyle.fontWeight, 10) || 400;

    const payload: ColorPickPayload = {
      foregroundColor,
      backgroundColor,
      fontSizePx,
      fontWeight,
    };

    window.parent.postMessage({ type: 'color-pick-result', payload }, '*');
    disableColorPicker();
  };

  document.addEventListener('mouseover', hoverListener, { capture: true });
  document.addEventListener('click', clickListener, { capture: true });
}

/**
 * Exit color picker mode: remove hover listeners, highlights, and click
 * interception, resetting the cursor to default.
 */
export function disableColorPicker(): void {
  if (hoverListener) {
    document.removeEventListener('mouseover', hoverListener, {
      capture: true,
    });
    hoverListener = null;
  }

  if (clickListener) {
    document.removeEventListener('click', clickListener, { capture: true });
    clickListener = null;
  }

  // Remove any leftover highlight
  if (
    currentHighlightedElement &&
    currentHighlightedElement instanceof HTMLElement
  ) {
    currentHighlightedElement.style.outline = '';
    currentHighlightedElement.style.cursor = '';
  }
  currentHighlightedElement = null;

  document.body.style.cursor = '';
}
