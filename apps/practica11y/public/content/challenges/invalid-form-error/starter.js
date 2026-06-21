const form = document.getElementById('reg-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = form.querySelector('button[type="submit"]');

function checkForm() {
  const valid =
    nameInput.value.trim() !== '' &&
    emailInput.value.includes('@') &&
    passwordInput.value.length >= 8;
  submitBtn.disabled = !valid;
}

nameInput.addEventListener('input', checkForm);
emailInput.addEventListener('input', checkForm);
passwordInput.addEventListener('input', checkForm);

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

  let hasErrors = false;

  if (nameInput.value.trim() === '') {
    nameError.textContent = 'Please enter your name';
    nameInput.classList.add('error');
    hasErrors = true;
  }

  if (!emailInput.value.includes('@')) {
    emailError.textContent = 'Please enter a valid email address';
    emailInput.classList.add('error');
    hasErrors = true;
  }

  if (passwordInput.value.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters';
    passwordInput.classList.add('error');
    hasErrors = true;
  }

  if (!hasErrors) {
    alert('Registration successful!');
  }
});
