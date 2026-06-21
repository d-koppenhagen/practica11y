import { runAxeAnalysis } from './lib/axe-runner';
import { enableColorPicker, disableColorPicker } from './lib/color-picker';

// Signal DOM is ready
window.parent.postMessage({ type: 'dom-ready' }, '*');

// Listen for messages from parent
window.addEventListener('message', async (event: MessageEvent) => {
  if (!event.data || !event.data.type) return;

  switch (event.data.type) {
    case 'run-analysis':
      try {
        const payload = await runAxeAnalysis();
        window.parent.postMessage({ type: 'axe-result', payload }, '*');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        window.parent.postMessage(
          { type: 'axe-error', payload: { message } },
          '*',
        );
      }
      break;

    case 'enable-color-picker':
      enableColorPicker();
      break;

    case 'disable-color-picker':
      disableColorPicker();
      break;
  }
});

// Observe DOM mutations and user interactions to notify parent
// for live tree updates (debounced to avoid excessive updates)
(() => {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function notifyInteractionChange(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.parent.postMessage({ type: 'interaction-change' }, '*');
    }, 150);
  }

  // MutationObserver for DOM attribute/structure changes
  const userContent = document.getElementById('user-content');
  if (userContent) {
    const observer = new MutationObserver(notifyInteractionChange);
    observer.observe(userContent, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // Input/change events for form values
  document.addEventListener('input', notifyInteractionChange, true);
  document.addEventListener('change', notifyInteractionChange, true);

  // Focus/blur for focus state changes
  document.addEventListener('focusin', notifyInteractionChange, true);
  document.addEventListener('focusout', notifyInteractionChange, true);
})();
