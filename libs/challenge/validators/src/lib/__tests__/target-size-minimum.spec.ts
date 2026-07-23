import { describe, it, expect, afterEach } from 'vitest';
import { targetSizeMinimum } from '../target-size-minimum';

describe('target-size-minimum', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "target-size-minimum"', async () => {
    expect(targetSizeMinimum.id).toBe('target-size-minimum');
  });

  describe('elements meeting minimum target size → pass', () => {
    it('should pass when buttons have min-width and min-height >= 24px', async () => {
      document.body.innerHTML = `
        <style>
          .remove { min-width: 24px; min-height: 24px; padding: 4px; }
        </style>
        <button class="remove" aria-label="Remove">×</button>
      `;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when links have min-width and min-height >= 24px', async () => {
      document.body.innerHTML = `
        <style>
          .pagination a { min-width: 24px; min-height: 24px; padding: 6px 10px; }
        </style>
        <nav class="pagination">
          <a href="?p=1">1</a>
        </nav>
      `;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when elements have sufficient padding to reach 24px', async () => {
      document.body.innerHTML = `
        <style>
          a { padding: 8px; font-size: 18px; }
        </style>
        <a href="/home" aria-label="Home">🏠</a>
      `;

      // padding (8+8=16) + fontSize (18) = 34 > 24
      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass when no interactive elements exist', async () => {
      document.body.innerHTML = `<p>No buttons or links here</p>`;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('elements below minimum target size → fail', () => {
    it('should fail when a button has tiny padding and no min-width/height', async () => {
      document.body.innerHTML = `
        <style>
          .remove { padding: 2px; font-size: 10px; }
        </style>
        <button class="remove">×</button>
      `;

      // padding (2+2=4) + fontSize (10) = 14 < 24
      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('1');
    });

    it('should fail when links have small padding', async () => {
      document.body.innerHTML = `
        <style>
          .pagination a { padding: 2px 6px; font-size: 12px; }
        </style>
        <nav class="pagination">
          <a href="?p=1">1</a>
          <a href="?p=2">2</a>
        </nav>
      `;

      // vertical: padding (2+2=4) + fontSize (12) = 16 < 24
      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('2');
    });

    it('should fail when icon links have minimal padding', async () => {
      document.body.innerHTML = `
        <style>
          .social a { padding: 4px; font-size: 14px; }
        </style>
        <div class="social">
          <a href="https://twitter.com"><i class="icon-twitter"></i></a>
        </div>
      `;

      // padding (4+4=8) + fontSize (14) = 22 < 24
      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(false);
    });

    it('should report correct count of failing elements', async () => {
      document.body.innerHTML = `
        <style>
          button { padding: 2px; font-size: 10px; }
          a { padding: 2px; font-size: 10px; }
        </style>
        <button>×</button>
        <a href="?p=1">1</a>
        <a href="?p=2">2</a>
      `;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('3');
    });
  });

  describe('the full starter/solution code from the challenge', () => {
    it('should fail on the starter code', async () => {
      document.body.innerHTML = `
        <style>
          .tag .remove {
            background: none;
            border: none;
            font-size: 10px;
            padding: 2px;
            cursor: pointer;
            line-height: 1;
          }
          .pagination a {
            display: inline-block;
            padding: 2px 6px;
            font-size: 12px;
            text-decoration: none;
            border: 1px solid #ccc;
          }
          .social a {
            display: inline-block;
            padding: 4px;
            font-size: 14px;
          }
        </style>
        <div class="tags">
          <span class="tag">Angular <button class="remove">×</button></span>
          <span class="tag">Vue <button class="remove">×</button></span>
          <span class="tag">React <button class="remove">×</button></span>
        </div>
        <nav class="pagination">
          <a href="?p=1">1</a>
          <a href="?p=2">2</a>
          <a href="?p=3">3</a>
          <a href="?p=4">4</a>
          <a href="?p=5">5</a>
        </nav>
        <div class="social">
          <a href="https://bsky.app"><i class="icon-bluesky"></i></a>
          <a href="https://linkedin.com"><i class="icon-linkedin"></i></a>
          <a href="https://github.com"><i class="icon-github"></i></a>
        </div>
      `;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(false);
      // 3 buttons + 5 pagination links + 3 social links = 11
      expect(result.details).toBeDefined();
    });

    it('should pass on the solution code', async () => {
      document.body.innerHTML = `
        <style>
          .tag .remove {
            background: none;
            border: none;
            font-size: 14px;
            min-width: 24px;
            min-height: 24px;
            padding: 4px;
            cursor: pointer;
            line-height: 1;
          }
          .pagination a {
            display: inline-block;
            min-width: 24px;
            min-height: 24px;
            padding: 6px 10px;
            font-size: 14px;
            text-decoration: none;
            border: 1px solid #ccc;
            text-align: center;
          }
          .social a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            min-height: 24px;
            padding: 8px;
            font-size: 18px;
          }
        </style>
        <div class="tags">
          <span class="tag">Angular <button class="remove" aria-label="Remove Angular">×</button></span>
          <span class="tag">Vue <button class="remove" aria-label="Remove Vue">×</button></span>
          <span class="tag">React <button class="remove" aria-label="Remove React">×</button></span>
        </div>
        <nav class="pagination" aria-label="Pagination">
          <a href="?p=1" aria-label="Page 1">1</a>
          <a href="?p=2" aria-label="Page 2">2</a>
          <a href="?p=3" aria-label="Page 3">3</a>
          <a href="?p=4" aria-label="Page 4">4</a>
          <a href="?p=5" aria-label="Page 5">5</a>
        </nav>
        <div class="social">
          <a href="https://bsky.app" aria-label="Bluesky"><i class="icon-bluesky" aria-hidden="true"></i></a>
          <a href="https://linkedin.com" aria-label="LinkedIn"><i class="icon-linkedin" aria-hidden="true"></i></a>
          <a href="https://github.com" aria-label="GitHub"><i class="icon-github" aria-hidden="true"></i></a>
        </div>
      `;

      const result = await targetSizeMinimum.validate(document);

      expect(result.passed).toBe(true);
    });
  });
});
