import { describe, it, expect, afterEach } from 'vitest';
import { imageAltText } from '../image-alt-text';

describe('image-alt-text', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "image-alt-text"', async () => {
    expect(imageAltText.id).toBe('image-alt-text');
  });

  describe('images with alt text → pass', () => {
    it('should pass when all images have non-empty alt', async () => {
      document.body.innerHTML = `
        <img src="photo.jpg" alt="A sunset over the ocean">
        <img src="logo.png" alt="Company logo">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('2');
    });

    it('should pass when decorative images have no alt', async () => {
      document.body.innerHTML = `
        <img src="decorative.png" role="presentation">
        <img src="spacer.gif" role="none">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No meaningful images');
    });

    it('should ignore decorative images and validate only meaningful ones', async () => {
      document.body.innerHTML = `
        <img src="hero.jpg" alt="Hero banner showing team meeting">
        <img src="divider.png" role="presentation">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('1 image(s) have alt text');
    });
  });

  describe('images without alt text → fail', () => {
    it('should fail when an image has no alt attribute', async () => {
      document.body.innerHTML = `
        <img src="photo.jpg">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
      expect(result.message).toContain('missing');
    });

    it('should fail when an image has empty alt (non-decorative)', async () => {
      document.body.innerHTML = `
        <img src="important-chart.png" alt="">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should fail when an image has whitespace-only alt', async () => {
      document.body.innerHTML = `
        <img src="photo.jpg" alt="   ">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should report correct count of missing alt texts', async () => {
      document.body.innerHTML = `
        <img src="a.jpg" alt="Valid alt">
        <img src="b.jpg">
        <img src="c.jpg" alt="">
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2 of 3');
    });
  });

  describe('no images → pass', () => {
    it('should pass when there are no images', async () => {
      document.body.innerHTML = `
        <p>No images here</p>
      `;

      const result = await imageAltText.validate(document);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No meaningful images');
    });
  });
});
