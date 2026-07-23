import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that focused elements are not obscured by fixed/sticky overlays.
 *
 * Uses a hybrid approach:
 * 1. Geometry check — identifies fixed/sticky overlays and checks if interactive
 *    elements would be obscured when focused (via focus + scroll + overlap detection)
 * 2. CSS property check — verifies that scroll-padding/scroll-margin is used to
 *    prevent obscuration during keyboard navigation
 * 3. Best practice — checks for :focus-visible instead of bare :focus
 */
export const focusNotObscured: Validator = {
  id: 'focus-not-obscured',

  async validate(
    document: Document,
    context?: unknown,
  ): Promise<ValidationResult> {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';

    const issues: string[] = [];

    // 1. Identify fixed/sticky overlays
    const overlays = findFixedOverlays(document);

    if (overlays.length === 0) {
      // No overlays found — nothing to obscure
      return {
        validatorId: 'focus-not-obscured',
        passed: true,
        message:
          'No fixed or sticky overlays detected. Focus obscuration is not a concern.',
      };
    }

    // 2. Geometry check — focus each interactive element and check overlap
    const interactiveElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main a, main button, main input, main select, main textarea, main [tabindex="0"]',
      ),
    );

    const obscuredElements: string[] = [];

    for (const el of interactiveElements) {
      // Focus the element — the browser will scroll it into view
      el.focus({ preventScroll: false });

      // Give the browser a tick to scroll
      await tick();

      const elRect = el.getBoundingClientRect();

      for (const overlay of overlays) {
        const overlayRect = overlay.el.getBoundingClientRect();

        if (rectsOverlap(elRect, overlayRect)) {
          const label = describeElement(el);
          obscuredElements.push(
            `"${label}" is obscured by fixed ${overlay.position} element (${describeElement(overlay.el)})`,
          );
          break; // One overlap per element is enough
        }
      }
    }

    if (obscuredElements.length > 0) {
      issues.push(
        `${obscuredElements.length} interactive element(s) are obscured by fixed overlays when focused:\n` +
          obscuredElements.map((msg) => `  - ${msg}`).join('\n'),
      );
    }

    // 3. CSS check — scroll-padding/scroll-margin as defensive measure
    const allCss = extractAllCss(sourceHtml, document);
    const hasScrollProtection = checkScrollProtection(allCss, document);

    if (!hasScrollProtection) {
      issues.push(
        'No scroll-padding or scroll-margin detected. Add scroll-padding to the html/body element or scroll-margin to interactive elements to prevent focus obscuration during keyboard navigation.',
      );
    }

    // 4. Best practice — :focus-visible instead of :focus
    const hasFocusVisible = /:focus-visible/i.test(allCss);
    const hasBareOnlyFocus = hasBareOnlyFocusSelector(allCss);

    if (!hasFocusVisible) {
      issues.push(
        'No :focus-visible selector found. Use :focus-visible instead of :focus to show focus indicators only for keyboard users.',
      );
    } else if (hasBareOnlyFocus) {
      issues.push(
        'Found bare :focus selector alongside :focus-visible. Replace :focus with :focus-visible for keyboard-only focus indicators.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'focus-not-obscured',
      passed,
      message: passed
        ? 'Focus obscuration is prevented. Interactive elements remain visible when focused behind fixed overlays.'
        : `${issues.length} issue(s) found that may cause focused elements to be obscured.`,
      details: passed ? undefined : issues.join('\n\n'),
    };
  },
};

// --- Helper functions ---

interface OverlayInfo {
  el: HTMLElement;
  position: 'fixed' | 'sticky';
}

/**
 * Finds all elements with position: fixed or sticky that could obscure content.
 */
function findFixedOverlays(document: Document): OverlayInfo[] {
  const overlays: OverlayInfo[] = [];
  const allElements = document.querySelectorAll<HTMLElement>('*');

  for (const el of allElements) {
    const style = document.defaultView?.getComputedStyle(el);
    if (!style) continue;

    const position = style.position;
    if (position === 'fixed' || position === 'sticky') {
      // Only consider elements with visible size (not hidden elements)
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        overlays.push({ el, position: position as 'fixed' | 'sticky' });
      }
    }
  }

  return overlays;
}

/**
 * Checks if two DOMRects overlap.
 */
function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

/**
 * Returns a short description of an element for error messages.
 */
function describeElement(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim().slice(0, 30) ?? '';
  const className = el.className ? `.${el.className.split(' ')[0]}` : '';

  if (text) return `<${tag}${className}> "${text}"`;
  return `<${tag}${className}>`;
}

/**
 * Checks whether scroll-padding or scroll-margin is present to protect
 * against focus obscuration.
 * Checks both CSS source and computed styles.
 */
function checkScrollProtection(css: string, document: Document): boolean {
  // Check CSS source for scroll-padding or scroll-margin declarations
  const hasScrollPaddingInCss =
    /scroll-padding(?:-top|-bottom|-block)?\s*:/i.test(css);
  const hasScrollMarginInCss =
    /scroll-margin(?:-top|-bottom|-block)?\s*:/i.test(css);

  if (hasScrollPaddingInCss || hasScrollMarginInCss) return true;

  // Check computed styles on html/body for scroll-padding
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  const view = document.defaultView;

  if (view) {
    const htmlStyle = view.getComputedStyle(htmlEl);
    const bodyStyle = view.getComputedStyle(bodyEl);

    const htmlScrollPaddingTop = parseInt(
      htmlStyle.getPropertyValue('scroll-padding-top'),
      10,
    );
    const htmlScrollPaddingBottom = parseInt(
      htmlStyle.getPropertyValue('scroll-padding-bottom'),
      10,
    );
    const bodyScrollPaddingTop = parseInt(
      bodyStyle.getPropertyValue('scroll-padding-top'),
      10,
    );
    const bodyScrollPaddingBottom = parseInt(
      bodyStyle.getPropertyValue('scroll-padding-bottom'),
      10,
    );

    if (
      htmlScrollPaddingTop > 0 ||
      htmlScrollPaddingBottom > 0 ||
      bodyScrollPaddingTop > 0 ||
      bodyScrollPaddingBottom > 0
    ) {
      return true;
    }
  }

  // Check computed scroll-margin on interactive elements inside main
  const interactiveInMain = document.querySelectorAll<HTMLElement>(
    'main a, main button, main input, main select, main textarea',
  );

  for (const el of interactiveInMain) {
    if (!view) break;
    const style = view.getComputedStyle(el);
    const marginTop = parseInt(style.getPropertyValue('scroll-margin-top'), 10);
    const marginBottom = parseInt(
      style.getPropertyValue('scroll-margin-bottom'),
      10,
    );

    if (marginTop > 0 || marginBottom > 0) return true;
  }

  return false;
}

/**
 * Extracts all CSS content from style blocks in HTML source and document.
 */
function extractAllCss(sourceHtml: string, doc: Document): string {
  const blocks: string[] = [];

  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(sourceHtml)) !== null) {
    blocks.push(match[1]);
  }

  const docStyles = Array.from(doc.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .join('\n');
  blocks.push(docStyles);

  return blocks.join('\n');
}

/**
 * Checks if there are bare :focus selectors (not :focus-visible or :focus-within)
 * that define outline styles.
 */
function hasBareOnlyFocusSelector(css: string): boolean {
  const bareFocusPattern = /:focus(?!-visible|-within)\s*[,{]/i;
  return bareFocusPattern.test(css);
}

/**
 * Returns a promise that resolves on the next microtask/frame,
 * giving the browser time to scroll after .focus().
 */
function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
