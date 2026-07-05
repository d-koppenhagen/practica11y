/**
 * Intercepts link navigation inside the sandbox preview iframe.
 * Prevents all anchor clicks from navigating away from the preview content
 * and shows a small toast notification indicating where the link would navigate.
 *
 * For in-page anchors (#id), scrolls to the target element instead of
 * letting the browser handle it (which would reload the srcdoc iframe).
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

      // Handle in-page anchors by scrolling to the target (or doing nothing)
      if (href.startsWith('#')) {
        if (href.length > 1) {
          const targetId = href.slice(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
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
