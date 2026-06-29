const form = document.getElementById('reg-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  // Reset
  nameError.textContent = '';
  emailError.textContent = '';
  passwordError.textContent = '';
  nameInput.classList.remove('error');
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');
  nameInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');
  passwordInput.removeAttribute('aria-invalid');

  let hasErrors = false;
  let firstInvalid = null;

  if (nameInput.value.trim() === '') {
    nameError.textContent = 'Please enter your name';
    nameInput.classList.add('error');
    nameInput.setAttribute('aria-invalid', 'true');
    hasErrors = true;
    if (!firstInvalid) firstInvalid = nameInput;
  }

  if (!emailInput.value.includes('@')) {
    emailError.textContent = 'Please enter a valid email address';
    emailInput.classList.add('error');
    emailInput.setAttribute('aria-invalid', 'true');
    hasErrors = true;
    if (!firstInvalid) firstInvalid = emailInput;
  }

  if (passwordInput.value.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters';
    passwordInput.classList.add('error');
    passwordInput.setAttribute('aria-invalid', 'true');
    hasErrors = true;
    if (!firstInvalid) firstInvalid = passwordInput;
  }

  if (hasErrors) {
    firstInvalid.focus();
  } else {
    alert('Registration successful!');
  }
});
