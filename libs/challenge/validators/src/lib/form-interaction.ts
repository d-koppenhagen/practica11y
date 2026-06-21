const NON_VALUE_INPUT_TYPES = new Set(['submit', 'button', 'reset', 'hidden']);

/**
 * Simulates submitting every form on the page with invalid (empty) field
 * values so that interaction-aware validators can inspect the resulting error
 * state (e.g. dynamically applied `aria-invalid`, error messages, or focus).
 *
 * Many accessible form-error solutions apply ARIA attributes and move focus
 * **only after a submit attempt**. Because validators receive the rendered
 * (static) DOM, this helper drives the form into its error state first by
 * clearing values and dispatching a cancelable `submit` event, which triggers
 * the learner's own submit handler without performing real navigation.
 *
 * The operation mutates the live sandbox DOM and is idempotent — calling it
 * multiple times leaves the form in the same invalid state.
 */
export function simulateInvalidSubmit(document: Document): void {
  const forms = Array.from(document.querySelectorAll('form'));
  if (forms.length === 0) {
    return;
  }

  const view = document.defaultView;
  const EventCtor = view?.Event ?? Event;

  for (const form of forms) {
    // Force an invalid state by clearing text-like fields and unchecking
    // checkboxes/radios. Empty values are invalid for the vast majority of
    // form validation logic (required fields, length/pattern checks, etc.).
    const fields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea',
      ),
    );
    for (const field of fields) {
      const type = (field.getAttribute('type') ?? 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        (field as HTMLInputElement).checked = false;
      } else if (!NON_VALUE_INPUT_TYPES.has(type)) {
        field.value = '';
      }
    }

    // Dispatch a cancelable submit event to run the learner's handler without
    // triggering an actual form submission/navigation.
    form.dispatchEvent(
      new EventCtor('submit', { bubbles: true, cancelable: true }),
    );
  }
}
