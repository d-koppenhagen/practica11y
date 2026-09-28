import { describe, it, expect, afterEach } from 'vitest';
import { liveRegionPattern } from '../live-region-pattern';

/**
 * Builds a minimal analysis context carrying the raw HTML source, matching the
 * shape validators receive from the analysis pipeline.
 */
function context(sourceHtml: string): { sourceHtml: string } {
  return { sourceHtml };
}

describe('live-region-pattern', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "live-region-pattern"', () => {
    expect(liveRegionPattern.id).toBe('live-region-pattern');
  });

  describe('persistent live region pattern', () => {
    it('passes when a persistent aria-live region exists in DOM and source', async () => {
      const html =
        '<div id="notifications" aria-live="polite" aria-atomic="true"></div>';
      document.body.innerHTML = html;

      const result = await liveRegionPattern.validate(document, context(html));

      expect(result.passed).toBe(true);
      expect(result.message).toContain('persistent region');
    });

    it('passes with role="status" as the live region', async () => {
      const html = '<div id="notifications" role="status"></div>';
      document.body.innerHTML = html;

      const result = await liveRegionPattern.validate(document, context(html));

      expect(result.passed).toBe(true);
    });

    it('fails when there is no live region at all', async () => {
      const html = '<div id="notifications"></div>';
      document.body.innerHTML = html;

      const result = await liveRegionPattern.validate(document, context(html));

      expect(result.passed).toBe(false);
      expect(result.details).toContain('No live region found');
    });

    it('fails when the live region is created dynamically in JS', async () => {
      // Rendered DOM has a live region (created by JS), but the source HTML does
      // not, and the source shows the dynamic-creation anti-pattern.
      document.body.innerHTML = '<div id="live" aria-live="polite"></div>';
      const source =
        "const el = document.createElement('div'); el.setAttribute('aria-live', 'polite');";

      const result = await liveRegionPattern.validate(
        document,
        context(source),
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('created dynamically');
    });
  });

  describe('ariaNotify() alternative', () => {
    it('passes when the solution calls element.ariaNotify() in a script tag', async () => {
      document.body.innerHTML = `
        <button id="notify">Notify</button>
        <script>
          document.getElementById('notify').addEventListener('click', () => {
            document.body.ariaNotify('Notification 1: Your action was successful!');
          });
        </script>
      `;

      const result = await liveRegionPattern.validate(document, context(''));

      expect(result.passed).toBe(true);
      expect(result.message).toContain('ariaNotify()');
    });

    it('passes when ariaNotify() is used even without any live region', async () => {
      document.body.innerHTML = `
        <button id="notify">Notify</button>
        <script>btn.ariaNotify("hello", { priority: "high" });</script>
      `;

      const result = await liveRegionPattern.validate(document, context(''));

      expect(result.passed).toBe(true);
    });

    it('passes when ariaNotify() only appears in the source HTML fallback', async () => {
      document.body.innerHTML = '<button id="notify">Notify</button>';
      const source =
        '<script>document.ariaNotify("Update available");</script>';

      const result = await liveRegionPattern.validate(
        document,
        context(source),
      );

      expect(result.passed).toBe(true);
      expect(result.message).toContain('ariaNotify()');
    });

    it('does not match unrelated identifiers containing "ariaNotify"', async () => {
      // A property read or comment mentioning the word without a call should not
      // trigger the ariaNotify pass path.
      document.body.innerHTML = `
        <div id="notifications"></div>
        <script>const myAriaNotifyHelper = 1;</script>
      `;
      const source = '<div id="notifications"></div>';

      const result = await liveRegionPattern.validate(
        document,
        context(source),
      );

      // No live region and no real ariaNotify() call -> should fail.
      expect(result.passed).toBe(false);
    });
  });
});
