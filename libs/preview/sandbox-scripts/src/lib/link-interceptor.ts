/**
 * Intercepts link navigation inside the sandbox preview iframe.
 * Prevents all anchor clicks from navigating away from the preview content
 * and shows a small toast notification indicating where the link would navigate.
 *
 * For in-page anchors (#id), scrolls to and moves focus to the target
 * element instead of letting the browser handle it (which would reload the
 * srcdoc iframe). Moving focus is essential for skip links to work: without
 * it, keyboard navigation would continue from the skip link rather than from
 * the target, defeating the purpose of the link.
 */
export function interceptLinkNavigation(): void {
  injectToastStyles();

  document.addEventListener(
    'click',
    (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      // Walk up the DOM tree to find the nearest anchor element
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Always prevent default — srcdoc iframes reload on any navigation
      event.preventDefault();

      // Handle in-page anchors by scrolling to and focusing the target
      if (href.startsWith('#')) {
        if (href.length > 1) {
          const targetId = href.slice(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            moveFocusTo(targetElement);
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // href="#" — scroll to top
          document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // For external/relative URLs, show the toast
      showNavigationToast(href);
    },
    { capture: true },
  );
}

/**
 * Moves keyboard focus to an in-page anchor target so skip links behave
 * correctly. Elements that are not natively focusable (e.g. `<main>`, `<div>`,
 * headings) get a temporary `tabindex="-1"` so they can receive programmatic
 * focus without being added to the tab order. Focus is applied without
 * scrolling here; the caller handles smooth scrolling separately to avoid a
 * jarring double scroll.
 */
function moveFocusTo(targetElement: HTMLElement): void {
  const needsTabindex = !isFocusable(targetElement);
  if (needsTabindex) {
    targetElement.setAttribute('tabindex', '-1');
  }

  targetElement.focus({ preventScroll: true });

  // If we added the tabindex ourselves, remove it once focus leaves the
  // element so the DOM (and any accessibility analysis) is not permanently
  // mutated by author-unintended attributes.
  if (needsTabindex) {
    targetElement.addEventListener(
      'blur',
      () => targetElement.removeAttribute('tabindex'),
      { once: true },
    );
  }
}

const NATIVELY_FOCUSABLE = new Set([
  'A',
  'AREA',
  'BUTTON',
  'DETAILS',
  'INPUT',
  'SELECT',
  'TEXTAREA',
]);

/**
 * Determines whether an element can already receive keyboard focus, so we
 * only inject a temporary `tabindex` on elements that actually need it
 * (e.g. `<main>`, `<div>`, headings). Natively focusable form controls and
 * links, or any element with an explicit `tabindex`, are left untouched.
 */
function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('tabindex')) {
    return true;
  }
  if (NATIVELY_FOCUSABLE.has(element.tagName)) {
    return true;
  }
  return element.isContentEditable;
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showNavigationToast(href: string): void {
  let toast = document.getElementById('a11y-nav-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'a11y-nav-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toast.textContent = `Navigation blocked → ${href}`;
  toast.classList.add('visible');

  toastTimeout = setTimeout(() => {
    toast!.classList.remove('visible');
  }, 3000);
}

function injectToastStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    #a11y-nav-toast {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%) translateY(100%);
      background: #1e293b;
      color: #f1f5f9;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      z-index: 99999;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #a11y-nav-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      #a11y-nav-toast {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);
}
