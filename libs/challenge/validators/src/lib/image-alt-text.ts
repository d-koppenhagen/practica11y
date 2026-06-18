import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that all meaningful images have non-empty alt attributes.
 * Decorative images with role="presentation" or role="none" are excluded.
 */
export const imageAltText: Validator = {
  id: 'image-alt-text',

  validate(document: Document, _context?: unknown): ValidationResult {
    const images = Array.from(document.querySelectorAll('img'));

    const meaningfulImages = images.filter((img) => !isDecorativeImage(img));

    if (meaningfulImages.length === 0) {
      return {
        validatorId: 'image-alt-text',
        passed: true,
        message: 'No meaningful images found.',
      };
    }

    const missingAlt = meaningfulImages.filter((img) => !hasNonEmptyAlt(img));
    const passed = missingAlt.length === 0;

    return {
      validatorId: 'image-alt-text',
      passed,
      message: passed
        ? `All ${meaningfulImages.length} image(s) have alt text.`
        : `${missingAlt.length} of ${meaningfulImages.length} image(s) missing alt text.`,
      details: passed
        ? undefined
        : missingAlt.map((img) => describeImage(img)).join('\n'),
    };
  },
};

function isDecorativeImage(img: Element): boolean {
  const role = img.getAttribute('role');
  return role === 'presentation' || role === 'none';
}

function hasNonEmptyAlt(img: Element): boolean {
  const alt = img.getAttribute('alt');
  return alt != null && alt.trim().length > 0;
}

function describeImage(img: Element): string {
  const src = img.getAttribute('src');
  const id = img.getAttribute('id');
  const classes = img.getAttribute('class');

  const parts = ['<img>'];
  if (id) parts.push(`id="${id}"`);
  if (classes) parts.push(`class="${classes}"`);
  if (src) parts.push(`src="${src}"`);
  parts.push('missing alt text');

  return parts.join(' ');
}
