document.getElementById('reg-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  // Reset
  emailError.textContent = '';
  passwordError.textContent = '';
  email.classList.remove('error');
  password.classList.remove('error');

  let hasErrors = false;

  if (!email.value.includes('@')) {
    emailError.textContent = 'Please enter a valid email address';
    email.classList.add('error');
    hasErrors = true;
  }

  if (password.value.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters';
    password.classList.add('error');
    hasErrors = true;
  }

  if (!hasErrors) {
    alert('Registration successful!');
  }
});
