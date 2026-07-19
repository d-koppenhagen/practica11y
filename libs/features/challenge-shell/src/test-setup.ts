/**
 * Patch CSSStyleSheet.prototype.href for jsdom compatibility with Node 24.18+.
 *
 * Node 24.18 introduced a change where util.inspect calls isURL() on objects,
 * which accesses the `href` getter. jsdom's CSSStyleSheet implementation throws
 * when `href` is accessed on constructable stylesheets (created via `new CSSStyleSheet()`).
 *
 * This patch makes `href` return null instead of throwing for constructable stylesheets.
 */
if (typeof CSSStyleSheet !== 'undefined') {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleSheet.prototype,
    'href',
  );
  if (originalDescriptor?.get) {
    Object.defineProperty(CSSStyleSheet.prototype, 'href', {
      get() {
        try {
          return originalDescriptor.get!.call(this);
        } catch {
          return null;
        }
      },
      configurable: true,
    });
  }
}
