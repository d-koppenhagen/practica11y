import type { Validator, ValidationResult } from '@practica11y/models';

const MIN_TARGET_SIZE = 24;

/**
 * Validates that all interactive elements (buttons, links) meet the
 * WCAG 2.5.8 minimum target size requirement of 24×24 CSS pixels.
 * Checks min-width/min-height or computed dimensions via inline styles and CSS classes.
 */
export const targetSizeMinimum: Validator = {
  id: 'target-size-minimum',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    const interactiveElements = Array.from(
      document.querySelectorAll('button, a[href], input, select, textarea'),
    );

    for (const element of interactiveElements) {
      const style = getComputedStyleFromElement(element);
      const minWidth = parsePx(style['minWidth']);
      const minHeight = parsePx(style['minHeight']);
      const width = parsePx(style['width']);
      const height = parsePx(style['height']);
      const paddingTop = parsePx(style['paddingTop']);
      const paddingBottom = parsePx(style['paddingBottom']);
      const paddingLeft = parsePx(style['paddingLeft']);
      const paddingRight = parsePx(style['paddingRight']);

      // Determine effective size — prefer min-width/min-height, then explicit width/height,
      // then estimate from padding + font-size for inline elements
      const effectiveWidth = getEffectiveSize(
        minWidth,
        width,
        paddingLeft + paddingRight,
        style['fontSize'],
      );
      const effectiveHeight = getEffectiveSize(
        minHeight,
        height,
        paddingTop + paddingBottom,
        style['fontSize'],
      );

      if (
        effectiveWidth < MIN_TARGET_SIZE ||
        effectiveHeight < MIN_TARGET_SIZE
      ) {
        issues.push(
          `<${element.tagName.toLowerCase()}> ${describeElement(element)} has an estimated target size of ${effectiveWidth}×${effectiveHeight}px (minimum required: ${MIN_TARGET_SIZE}×${MIN_TARGET_SIZE}px). Use min-width/min-height or increase padding.`,
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'target-size-minimum',
      passed,
      message: passed
        ? 'All interactive elements meet the minimum 24×24px target size.'
        : `${issues.length} element(s) have a target size below the 24×24px minimum.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Gets computed style properties from an element by inspecting inline styles
 * and the document's stylesheets (since we operate on a parsed DOM, not a
 * rendered document with a CSSOM).
 */
function getComputedStyleFromElement(element: Element): Record<string, string> {
  const result: Record<string, string> = {};
  const properties = [
    'min-width',
    'min-height',
    'width',
    'height',
    'padding',
    'padding-top',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'font-size',
  ];

  // Start with defaults
  for (const prop of properties) {
    result[toCamelCase(prop)] = '';
  }

  // Collect styles from <style> elements matching this element
  const doc = element.ownerDocument;
  const styleElements = Array.from(doc.querySelectorAll('style'));

  for (const styleEl of styleElements) {
    const cssText = styleEl.textContent ?? '';
    applyMatchingRules(element, cssText, result);
  }

  // Inline styles override
  const inlineStyle = element.getAttribute('style');
  if (inlineStyle) {
    parseStyleString(inlineStyle, result);
  }

  // Expand shorthand padding if individual sides are not set
  if (result['padding'] && (!result['paddingTop'] || !result['paddingLeft'])) {
    const paddingValues = result['padding'].trim().split(/\s+/);
    const [top, right, bottom, left] = expandShorthand(paddingValues);
    if (!result['paddingTop']) result['paddingTop'] = top;
    if (!result['paddingRight']) result['paddingRight'] = right;
    if (!result['paddingBottom']) result['paddingBottom'] = bottom;
    if (!result['paddingLeft']) result['paddingLeft'] = left;
  }

  return result;
}

/**
 * Parses a CSS text block and applies matching rules to the result.
 * Uses a simple regex-based CSS parser suitable for challenge validation.
 */
function applyMatchingRules(
  element: Element,
  cssText: string,
  result: Record<string, string>,
): void {
  // Simple CSS rule extraction: selector { properties }
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2];

    try {
      if (element.matches(selector)) {
        parseStyleString(declarations, result);
      }
    } catch {
      // Skip invalid selectors (pseudo-elements, etc.)
    }
  }
}

function parseStyleString(
  styleString: string,
  result: Record<string, string>,
): void {
  const declarations = styleString.split(';');
  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;
    const prop = decl.substring(0, colonIndex).trim();
    const value = decl.substring(colonIndex + 1).trim();
    if (prop && value) {
      result[toCamelCase(prop)] = value;
    }
  }
}

function toCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function parsePx(value: string | undefined): number {
  if (!value) return 0;
  const match = value.match(/^([\d.]+)px$/);
  return match ? parseFloat(match[1]) : 0;
}

function expandShorthand(values: string[]): [string, string, string, string] {
  switch (values.length) {
    case 1:
      return [values[0], values[0], values[0], values[0]];
    case 2:
      return [values[0], values[1], values[0], values[1]];
    case 3:
      return [values[0], values[1], values[2], values[1]];
    case 4:
      return [values[0], values[1], values[2], values[3]];
    default:
      return ['0px', '0px', '0px', '0px'];
  }
}

/**
 * Estimates the effective target size from available CSS properties.
 * Priority: min-width/min-height > explicit width/height > padding + content estimate
 */
function getEffectiveSize(
  minSize: number,
  explicitSize: number,
  totalPadding: number,
  fontSize: string | undefined,
): number {
  // If min-width/min-height is set and >= 24, that's the guarantee
  if (minSize >= MIN_TARGET_SIZE) return minSize;

  // If explicit size is set
  if (explicitSize > 0) return Math.max(explicitSize, minSize);

  // Estimate from padding + content (font-size as proxy for content height)
  const fontSizePx = parsePx(fontSize) || 16; // default 16px
  const estimated = totalPadding + fontSizePx;

  return Math.max(estimated, minSize);
}

function describeElement(element: Element): string {
  const href = element.getAttribute('href');
  const classes = element.getAttribute('class');
  const ariaLabel = element.getAttribute('aria-label');

  const parts: string[] = [];
  if (ariaLabel) parts.push(`"${ariaLabel}"`);
  if (href) parts.push(`href="${href}"`);
  if (classes) parts.push(`class="${classes}"`);

  return parts.length > 0 ? `(${parts.join(', ')})` : '';
}
