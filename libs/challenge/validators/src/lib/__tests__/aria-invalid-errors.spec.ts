import { describe, it, expect, afterEach } from 'vitest';
import { ariaInvalidErrors } from '../aria-invalid-errors';

/**
 * Renders the registration form markup used by the `invalid-form-error`
 * challenge and attaches the provided submit handler.
 */
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

/** The original, inaccessible starter behavior (visual-only error marking). */
function visualOnlyHandler(e: SubmitEvent): void {
  e.preventDefault();
  const email = document.getElementById('email') as HTMLInputElement;
  const emailError = document.getElementById('email-error')!;
  emailError.textContent = '';
  email.classList.remove('error');
  if (!email.value.includes('@')) {
    emailError.textContent = 'Please enter a valid email address';
    email.classList.add('error');
  }
}

/** A correct, accessible solution: aria-invalid + aria-describedby + message. */
function accessibleHandler(e: SubmitEvent): void {
  e.preventDefault();
  const email = document.getElementById('email') as HTMLInputElement;
  const password = document.getElementById('password') as HTMLInputElement;
  const emailError = document.getElementById('email-error')!;
  const passwordError = document.getElementById('password-error')!;

  for (const [field, error] of [
    [email, emailError],
    [password, passwordError],
  ] as const) {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    error.textContent = '';
  }

  if (!email.value.includes('@')) {
    emailError.textContent = 'Please enter a valid email address';
    email.setAttribute('aria-invalid', 'true');
    email.setAttribute('aria-describedby', 'email-error');
  }
  if (password.value.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters';
    password.setAttribute('aria-invalid', 'true');
    password.setAttribute('aria-describedby', 'password-error');
  }
}

describe('aria-invalid-errors', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "aria-invalid-errors"', () => {
    expect(ariaInvalidErrors.id).toBe('aria-invalid-errors');
  });

  it('should fail when there are no form fields', () => {
    document.body.innerHTML = '<p>No form here</p>';
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('No form fields');
  });

  it('should fail on the visual-only starter (no aria-invalid set)', () => {
    renderForm(visualOnlyHandler);
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('aria-invalid="true"');
  });

  it('should fail when aria-invalid is statically "false"', () => {
    renderForm((e) => e.preventDefault());
    document.getElementById('email')!.setAttribute('aria-invalid', 'false');
    document
      .getElementById('email')!
      .setAttribute('aria-describedby', 'email-error');
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
  });

  it('should fail when invalid field has no associated error message', () => {
    renderForm((e) => {
      e.preventDefault();
      document.getElementById('email')!.setAttribute('aria-invalid', 'true');
      // No aria-describedby / aria-errormessage
    });
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('aria-describedby');
  });

  it('should fail when the referenced error message element is empty', () => {
    renderForm((e) => {
      e.preventDefault();
      const email = document.getElementById('email')!;
      email.setAttribute('aria-invalid', 'true');
      email.setAttribute('aria-describedby', 'email-error');
      // error span left empty
    });
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('empty');
  });

  it('should fail when aria-describedby references a non-existent id', () => {
    renderForm((e) => {
      e.preventDefault();
      const email = document.getElementById('email')!;
      email.setAttribute('aria-invalid', 'true');
      email.setAttribute('aria-describedby', 'does-not-exist');
    });
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('non-existent');
  });

  it('should pass for a correct accessible solution', () => {
    renderForm(accessibleHandler);
    const result = ariaInvalidErrors.validate(document);
    expect(result.passed).toBe(true);
  });

  it('should fail when only one of two error fields is marked invalid', () => {
    // Both fields show an error message, but only email is marked/associated.
    renderForm((e) => {
      e.preventDefault();
      const email = document.getElementById('email') as HTMLInputElement;
      const emailError = document.getElementById('email-error')!;
      const passwordError = document.getElementById('password-error')!;

      emailError.textContent = 'Please enter a valid email address';
      email.setAttribute('aria-invalid', 'true');
      email.setAttribute('aria-describedby', 'email-error');

      // password error is shown visually but never marked/associated
      passwordError.textContent = 'Password must be at least 8 characters';
    });

    const result = ariaInvalidErrors.validate(document);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('not linked');
  });

  it('should fail when aria-invalid is set without aria-describedby (regression)', () => {
    // Mirrors a learner solution that marks aria-invalid but forgets to link
    // the message, on a single field only.
    renderForm((e) => {
      e.preventDefault();
      const email = document.getElementById('email') as HTMLInputElement;
      document.getElementById('email-error')!.textContent =
        'Please enter a valid email address';
      email.setAttribute('aria-invalid', 'true');
      // no aria-describedby
    });

    const result = ariaInvalidErrors.validate(document);

    expect(result.passed).toBe(false);
  });
});
