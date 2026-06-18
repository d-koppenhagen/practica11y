import type { Validator, ValidationResult } from '@practica11y/models';

const MAX_ALT_LENGTH = 150;

/**
 * Validates that all meaningful images have alt text that does not exceed
 * the recommended maximum length of 150 characters.
 * Complex images should use a short summary in alt and provide detailed
 * descriptions via aria-describedby.
 */
export const imageAltTextLimit: Validator = {
  id: 'image-alt-text-limit',

  validate(document: Document, _context?: unknown): ValidationResult {
    const images = Array.from(document.querySelectorAll('img'));

    const meaningfulImages = images.filter((img) => !isDecorativeImage(img));

    if (meaningfulImages.length === 0) {
      return {
        validatorId: 'image-alt-text-limit',
        passed: true,
        message: 'No meaningful images found.',
      };
    }

    const issues: string[] = [];

    for (const img of meaningfulImages) {
      const alt = img.getAttribute('alt');

      if (alt == null || alt.trim().length === 0) {
        issues.push(describeImage(img, 'missing alt text'));
      } else if (alt.length > MAX_ALT_LENGTH) {
        issues.push(
          describeImage(
            img,
            `alt text too long (${alt.length} characters, max ${MAX_ALT_LENGTH})`,
          ),
        );
      }
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'image-alt-text-limit',
      passed,
      message: passed
        ? `All image alt texts are within the ${MAX_ALT_LENGTH}-character limit.`
        : `${issues.length} image(s) have alt text issues.`,
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
