import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { interceptLinkNavigation } from '../link-interceptor';

describe('interceptLinkNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    interceptLinkNavigation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  function clickLink(element: HTMLElement): MouseEvent {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
    return event;
  }

  describe('style injection', () => {
    it('should inject toast styles into the document head', () => {
      const styles = document.querySelectorAll('style');
      const hasToastStyle = Array.from(styles).some((s) =>
        s.textContent?.includes('a11y-nav-toast'),
      );
      expect(hasToastStyle).toBe(true);
    });

    it('should include prefers-reduced-motion media query', () => {
      const styles = document.querySelectorAll('style');
      const hasMotionQuery = Array.from(styles).some((s) =>
        s.textContent?.includes('prefers-reduced-motion'),
      );
      expect(hasMotionQuery).toBe(true);
    });
  });

  describe('external URLs', () => {
    it('should prevent default on external links', () => {
      document.body.innerHTML = '<a href="https://example.com">Link</a>';
      const link = document.querySelector('a')!;

      const event = clickLink(link);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should show a toast with the URL', () => {
      document.body.innerHTML = '<a href="https://example.com">Link</a>';
      const link = document.querySelector('a')!;

      clickLink(link);

      const toast = document.getElementById('a11y-nav-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toBe(
        'Navigation blocked → https://example.com',
      );
      expect(toast!.classList.contains('visible')).toBe(true);
    });

    it('should set role="status" and aria-live="polite" on the toast', () => {
      document.body.innerHTML = '<a href="https://example.com">Link</a>';
      const link = document.querySelector('a')!;

      clickLink(link);

      const toast = document.getElementById('a11y-nav-toast');
      expect(toast!.getAttribute('role')).toBe('status');
      expect(toast!.getAttribute('aria-live')).toBe('polite');
    });

    it('should reuse existing toast element on subsequent clicks', () => {
      document.body.innerHTML = `
        <a href="https://first.com">First</a>
        <a href="https://second.com">Second</a>
      `;

      clickLink(document.querySelectorAll('a')[0]);
      clickLink(document.querySelectorAll('a')[1]);

      const toasts = document.querySelectorAll('#a11y-nav-toast');
      expect(toasts.length).toBe(1);
      expect(toasts[0].textContent).toBe(
        'Navigation blocked → https://second.com',
      );
    });

    it('should hide the toast after 3 seconds', () => {
      vi.useFakeTimers();
      document.body.innerHTML = '<a href="https://example.com">Link</a>';
      const link = document.querySelector('a')!;

      clickLink(link);
      const toast = document.getElementById('a11y-nav-toast')!;

      expect(toast.classList.contains('visible')).toBe(true);

      vi.advanceTimersByTime(3000);

      expect(toast.classList.contains('visible')).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('relative URLs', () => {
    it('should prevent default on relative path links', () => {
      document.body.innerHTML = '<a href="/products/headphones">Link</a>';
      const link = document.querySelector('a')!;

      const event = clickLink(link);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should show a toast for query parameter links', () => {
      document.body.innerHTML = '<a href="?p=2">Page 2</a>';
      const link = document.querySelector('a')!;

      clickLink(link);

      const toast = document.getElementById('a11y-nav-toast');
      expect(toast!.textContent).toBe('Navigation blocked → ?p=2');
    });
  });

  describe('hash/anchor links', () => {
    it('should prevent default on hash links', () => {
      document.body.innerHTML = '<a href="#section">Section</a>';
      const link = document.querySelector('a')!;

      const event = clickLink(link);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should NOT show a toast for hash links', () => {
      document.body.innerHTML = '<a href="#section">Section</a>';
      const link = document.querySelector('a')!;

      clickLink(link);

      const toast = document.getElementById('a11y-nav-toast');
      expect(toast).toBeNull();
    });

    it('should scroll to the target element if it exists', () => {
      document.body.innerHTML = `
        <a href="#news">News</a>
        <div id="news">News Section</div>
      `;
      const target = document.getElementById('news')!;
      target.scrollIntoView = vi.fn();
      const link = document.querySelector('a')!;

      clickLink(link);

      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    it('should not throw when target element does not exist', () => {
      document.body.innerHTML = '<a href="#nonexistent">Link</a>';
      const link = document.querySelector('a')!;

      expect(() => clickLink(link)).not.toThrow();
    });

    it('should scroll to top for href="#"', () => {
      document.body.innerHTML = '<a href="#">Home</a>';
      document.documentElement.scrollTo = vi.fn();
      const link = document.querySelector('a')!;

      clickLink(link);

      expect(document.documentElement.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });

  describe('non-link clicks', () => {
    it('should not interfere with button clicks', () => {
      document.body.innerHTML = '<button>Click me</button>';
      const button = document.querySelector('button')!;

      const event = clickLink(button);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should not interfere with clicks on non-interactive elements', () => {
      document.body.innerHTML = '<p>Some text</p>';
      const p = document.querySelector('p')!;

      const event = clickLink(p);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should not interfere with links that have no href', () => {
      document.body.innerHTML = '<a>No href</a>';
      const link = document.querySelector('a')!;

      const event = clickLink(link);

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('nested elements inside links', () => {
    it('should intercept clicks on child elements of a link', () => {
      document.body.innerHTML =
        '<a href="https://example.com"><span>Nested text</span></a>';
      const span = document.querySelector('span')!;

      const event = clickLink(span);

      expect(event.defaultPrevented).toBe(true);
      const toast = document.getElementById('a11y-nav-toast');
      expect(toast!.textContent).toBe(
        'Navigation blocked → https://example.com',
      );
    });

    it('should intercept clicks on deeply nested elements', () => {
      document.body.innerHTML =
        '<a href="https://github.com"><i class="icon"><svg><path/></svg></i></a>';
      const icon = document.querySelector('i')!;

      const event = clickLink(icon);

      expect(event.defaultPrevented).toBe(true);
    });
  });
});
