import { describe, it, expect, afterEach } from 'vitest';
import { errorFocusManagement } from '../error-focus-management';

function renderForm(onSubmit: (event: SubmitEvent) => void): void {
  document.body.innerHTML = `
    <form id="reg-form" novalidate>
      <div class="form-field">
        <label for="email">Email</label>
        <input type="email" id="email" />
        <span class="error-text" id="email-error"></span>
      </div>
      <div class="form-field">
        <label for="password">Password</label>
        <input type="password" id="password" />
        <span class="error-text" id="password-error"></span>
      </div>
      <button type="submit">Register</button>
    </form>
  `;
  document
    .getElementById('reg-form')!
    .addEventListener('submit', (e) => onSubmit(e as SubmitEvent));
}

/** Marks both fields invalid and focuses the first invalid one. */
function focusFirstInvalidHandler(e: SubmitEvent): void {
  e.preventDefault();
  const email = document.getElementById('email') as HTMLInputElement;
  const password = document.getElementById('password') as HTMLInputElement;

  const invalid: HTMLInputElement[] = [];
  if (!email.value.includes('@')) {
    email.setAttribute('aria-invalid', 'true');
    invalid.push(email);
  }
  if (password.value.length < 8) {
    password.setAttribute('aria-invalid', 'true');
    invalid.push(password);
  }
  invalid[0]?.focus();
}

describe('error-focus-management', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "error-focus-management"', async () => {
    expect(errorFocusManagement.id).toBe('error-focus-management');
  });

  it('should fail when there is no form', async () => {
    document.body.innerHTML = '<p>No form here</p>';
    const result = await errorFocusManagement.validate(document);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('No form');
  });

  it('should fail when focus is not moved after an invalid submit', async () => {
    renderForm((e) => {
      e.preventDefault();
      document.getElementById('email')!.setAttribute('aria-invalid', 'true');
      // No focus() call
    });
    const result = await errorFocusManagement.validate(document);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('focus');
  });

  it('should fail when focus moves to a field that is not aria-invalid', async () => {
    renderForm((e) => {
      e.preventDefault();
      // Focus a field but never mark it invalid.
      (document.getElementById('email') as HTMLInputElement).focus();
    });
    const result = await errorFocusManagement.validate(document);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('aria-invalid');
  });

  it('should fail when focus moves to a later invalid field, not the first', async () => {
    renderForm((e) => {
      e.preventDefault();
      const email = document.getElementById('email') as HTMLInputElement;
      const password = document.getElementById('password') as HTMLInputElement;
      email.setAttribute('aria-invalid', 'true');
      password.setAttribute('aria-invalid', 'true');
      password.focus(); // wrong: should focus the first invalid field
    });
    const result = await errorFocusManagement.validate(document);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('first');
  });

  it('should pass when focus moves to the first invalid field', async () => {
    renderForm(focusFirstInvalidHandler);
    const result = await errorFocusManagement.validate(document);
    expect(result.passed).toBe(true);
  });
});
