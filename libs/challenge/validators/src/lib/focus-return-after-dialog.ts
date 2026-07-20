import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Validates that focus is returned to the triggering element after a dialog closes.
 *
 * Checks:
 * 1. A reference to the trigger element is saved before/when the dialog opens
 * 2. `.focus()` is called on the trigger reference after the dialog is hidden/closed
 */
export const focusReturnAfterDialog: Validator = {
  id: 'focus-return-after-dialog',

  validate(document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const errors: string[] = [];

    // Gather script content from DOM or source HTML
    const scripts = Array.from(document.querySelectorAll('script'));
    const domScriptContent = scripts.map((s) => s.textContent ?? '').join('\n');
    const scriptContent = domScriptContent.trim()
      ? domScriptContent
      : (analysisResult?.sourceHtml ?? '');

    // Check 1: A trigger element reference is stored.
    // The user must save a reference to the button/element that opened the dialog.
    const savesTriggerRef =
      /\b\w+\s*=\s*(?:btn|button|e\.target|event\.target|e\.currentTarget|event\.currentTarget|this|document\.activeElement)\b/.test(
        scriptContent,
      );

    if (!savesTriggerRef) {
      errors.push(
        'No trigger element reference is saved. Before or when the dialog opens, store a reference to the element that triggered it (e.g., the clicked button or `document.activeElement`).',
      );
    }

    // Check 2: .focus() is called on the stored trigger reference after the dialog closes.
    // Exclude known non-trigger variables (dialog, modal, confirmBtn, cancelBtn, input elements).
    const hasFocusCallOnVariable =
      /\b(?!(?:dialog|modal|confirmBtn|cancelBtn|confirm-btn|cancel-btn|firstFocusable|lastFocusable|input)\b)\w+\.focus\s*\(/.test(
        scriptContent,
      );

    if (!hasFocusCallOnVariable) {
      errors.push(
        'No .focus() call found on the trigger element. After closing the dialog, call .focus() on the saved trigger reference to return focus.',
      );
    }

    const passed = errors.length === 0;

    return {
      validatorId: 'focus-return-after-dialog',
      passed,
      message: passed
        ? 'Focus is correctly returned to the trigger element after the dialog closes.'
        : `Focus return has ${errors.length} issue(s).`,
      details: passed ? undefined : errors.join('\n'),
    };
  },
};
