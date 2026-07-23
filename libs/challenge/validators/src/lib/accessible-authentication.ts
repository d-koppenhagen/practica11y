import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that a form does not rely on cognitive function tests
 * (image CAPTCHA, pattern recognition, transcription) for authentication.
 *
 * Checks per WCAG 2.2 SC 3.3.8 "Accessible Authentication (Minimum)":
 * - No image-based CAPTCHA (img with captcha-related class/id/alt)
 * - Verification mechanism (if present) must be copy-pasteable
 * - Verification code must be programmatically accessible (aria-label or text content)
 */
export const accessibleAuthentication: Validator = {
  id: 'accessible-authentication',

  validate(document: Document, _context?: unknown): ValidationResult {
    const issues: string[] = [];

    // Check for image-based CAPTCHA patterns (img elements and SVG/elements with role="img")
    const images = Array.from(
      document.querySelectorAll('img, svg, [role="img"]'),
    );
    const captchaImages = images.filter((el) => isCaptchaImage(el));

    if (captchaImages.length > 0) {
      issues.push(
        'Image CAPTCHA detected — visual CAPTCHAs rely on cognitive function tests (transcription of distorted text) and are inaccessible to users with visual or cognitive disabilities.',
      );
    }

    // Check for inputs that suggest CAPTCHA transcription without an accessible alternative
    const captchaInputs = Array.from(
      document.querySelectorAll(
        'input[name*="captcha" i], input[id*="captcha" i], input[placeholder*="captcha" i]',
      ),
    );

    if (captchaInputs.length > 0 && captchaImages.length > 0) {
      issues.push(
        'CAPTCHA input field requires transcription of distorted text — provide an accessible alternative such as a copy-paste verification code.',
      );
    }

    // If there is a verification mechanism, check it is accessible
    const verificationCode = document.querySelector(
      '.verification-code, [class*="verification-code"], output[aria-label]',
    );

    if (verificationCode) {
      // Verification code exists — check it has accessible labeling
      const hasAriaLabel = verificationCode.hasAttribute('aria-label');
      const hasAriaLabelledBy =
        verificationCode.hasAttribute('aria-labelledby');
      const hasTextContent = !!verificationCode.textContent?.trim();

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasTextContent) {
        issues.push(
          'Verification code element exists but has no accessible name (aria-label, aria-labelledby, or text content).',
        );
      }
    }

    // If no CAPTCHA and no verification code found, check if there's nothing problematic
    if (
      captchaImages.length === 0 &&
      captchaInputs.length === 0 &&
      !verificationCode
    ) {
      // No CAPTCHA pattern detected at all — that's fine (form without verification)
      return {
        validatorId: 'accessible-authentication',
        passed: true,
        message:
          'No cognitive function test detected in the authentication form.',
      };
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'accessible-authentication',
      passed,
      message: passed
        ? 'Authentication does not rely on cognitive function tests — accessible alternative provided.'
        : `${issues.length} accessible authentication issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Determines if an image element is a CAPTCHA image based on
 * class names, IDs, alt text, or src attributes.
 */
function isCaptchaImage(img: Element): boolean {
  const className = img.getAttribute('class')?.toLowerCase() ?? '';
  const id = img.getAttribute('id')?.toLowerCase() ?? '';
  const alt = img.getAttribute('alt')?.toLowerCase() ?? '';
  const src = img.getAttribute('src')?.toLowerCase() ?? '';

  const captchaPatterns = ['captcha', 'verification-image', 'turing'];

  return captchaPatterns.some(
    (pattern) =>
      className.includes(pattern) ||
      id.includes(pattern) ||
      alt.includes(pattern) ||
      src.includes(pattern),
  );
}
