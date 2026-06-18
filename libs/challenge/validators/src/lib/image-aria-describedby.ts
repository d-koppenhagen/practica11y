import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that complex images use aria-describedby to reference
 * an element containing a detailed description.
 * Checks that:
 * - The image has an aria-describedby attribute
 * - The referenced element exists in the document
 * - The referenced element has non-empty text content
 */
export const imageAriaDescribedby: Validator = {
  id: 'image-aria-describedby',

  validate(document: Document, _context?: unknown): ValidationResult {
    const images = Array.from(document.querySelectorAll('img'));

    const meaningfulImages = images.filter((img) => !isDecorativeImage(img));

    if (meaningfulImages.length === 0) {
      return {
        validatorId: 'image-aria-describedby',
        passed: true,
        message: 'No meaningful images found.',
      };
    }

    const issues: string[] = [];

    for (const img of meaningfulImages) {
      const describedBy = img.getAttribute('aria-describedby');

      if (!describedBy || describedBy.trim().length === 0) {
        issues.push(describeImage(img, 'missing aria-describedby attribute'));
        continue;
      }

      const referencedElement = document.getElementById(describedBy.trim());

      if (!referencedElement) {
        issues.push(
          describeImage(
            img,
            `aria-describedby references "${describedBy}" but no element with that id exists`,
          ),
        );
        continue;
      }

      const textContent = referencedElement.textContent?.trim();
      if (!textContent || textContent.length === 0) {
        issues.push(
          describeImage(
            img,
            `aria-describedby references "${describedBy}" but the element is empty`,
          ),
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'image-aria-describedby',
      passed,
      message: passed
        ? 'All images have valid aria-describedby references.'
        : `${issues.length} image(s) have aria-describedby issues.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

function isDecorativeImage(img: Element): boolean {
  const role = img.getAttribute('role');
  return role === 'presentation' || role === 'none';
}

function describeImage(img: Element, issue: string): string {
  const src = img.getAttribute('src');
  const id = img.getAttribute('id');
  const classes = img.getAttribute('class');

  const parts = ['<img>'];
  if (id) parts.push(`id="${id}"`);
  if (classes) parts.push(`class="${classes}"`);
  if (src) parts.push(`src="${src}"`);
  parts.push(`— ${issue}`);

  return parts.join(' ');
}
