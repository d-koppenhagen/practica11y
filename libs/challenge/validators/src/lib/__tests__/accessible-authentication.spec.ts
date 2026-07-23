import { describe, it, expect, afterEach } from 'vitest';
import { accessibleAuthentication } from '../accessible-authentication';

describe('accessible-authentication', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "accessible-authentication"', () => {
    expect(accessibleAuthentication.id).toBe('accessible-authentication');
  });

  describe('image CAPTCHA detected → fail', () => {
    it('should fail when an img has captcha in class name', async () => {
      document.body.innerHTML = `
        <form>
          <img src="captcha.png" class="captcha-image">
          <input type="text" name="captcha" placeholder="Enter CAPTCHA">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('issue(s) found');
      expect(result.details).toContain('Image CAPTCHA detected');
    });

    it('should fail when an img has captcha in src', async () => {
      document.body.innerHTML = `
        <form>
          <img src="/images/captcha-challenge.png" class="verify-img">
          <input type="text" id="captcha-input">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Image CAPTCHA detected');
    });

    it('should fail when an img has captcha in id', async () => {
      document.body.innerHTML = `
        <form>
          <img src="verify.png" id="captcha-img">
          <input type="text" name="captcha">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should fail when an img has captcha in alt text', async () => {
      document.body.innerHTML = `
        <form>
          <img src="test.png" alt="captcha verification image">
          <input type="text" id="captcha">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should fail when an SVG has captcha in class name', async () => {
      document.body.innerHTML = `
        <form>
          <svg class="captcha-image" viewBox="0 0 200 60" aria-hidden="true">
            <text x="15" y="42">X7k9Qm</text>
          </svg>
          <input type="text" id="captcha" name="captcha" placeholder="Enter CAPTCHA">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Image CAPTCHA detected');
    });

    it('should report both CAPTCHA image and input issues', async () => {
      document.body.innerHTML = `
        <form>
          <img src="captcha.png" class="captcha-image">
          <input type="text" name="captcha" placeholder="Enter CAPTCHA">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Image CAPTCHA detected');
      expect(result.details).toContain(
        'CAPTCHA input field requires transcription',
      );
    });
  });

  describe('accessible verification → pass', () => {
    it('should pass with a copy-paste verification code using output element', async () => {
      document.body.innerHTML = `
        <form>
          <output class="verification-code" aria-label="Verification code to copy">X7k-9Qm</output>
          <label for="verify">Paste code here</label>
          <input type="text" id="verify" name="verify">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain(
        'does not rely on cognitive function tests',
      );
    });

    it('should pass with a verification code element with text content', async () => {
      document.body.innerHTML = `
        <form>
          <span class="verification-code">ABC-123</span>
          <input type="text" name="verify">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass with output element having aria-label', async () => {
      document.body.innerHTML = `
        <form>
          <output aria-label="Code to paste">M3x-7Pq</output>
          <input type="text" name="code">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('no verification mechanism → pass', () => {
    it('should pass when form has no CAPTCHA or verification at all', async () => {
      document.body.innerHTML = `
        <form>
          <label for="email">Email</label>
          <input type="email" id="email" name="email">
          <label for="pass">Password</label>
          <input type="password" id="pass" name="pass">
          <button type="submit">Log In</button>
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No cognitive function test detected');
    });

    it('should pass when there are only regular images (no CAPTCHA)', async () => {
      document.body.innerHTML = `
        <form>
          <img src="logo.png" alt="Company logo">
          <input type="text" name="username">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('verification code without accessible name → fail', () => {
    it('should fail when verification code element has no text or aria-label', async () => {
      document.body.innerHTML = `
        <form>
          <span class="verification-code"></span>
          <input type="text" name="verify">
        </form>
      `;

      const result = await accessibleAuthentication.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('no accessible name');
    });
  });
});
