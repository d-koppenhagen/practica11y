const form = document.getElementById('signup-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const termsInput = document.getElementById('terms');
const submitBtn = form.querySelector('button[type="submit"]');

function checkForm() {
  const valid =
    nameInput.value.trim() !== '' &&
    emailInput.value.includes('@') &&
    termsInput.checked;
  submitBtn.disabled = !valid;
}

nameInput.addEventListener('input', checkForm);
emailInput.addEventListener('input', checkForm);
termsInput.addEventListener('change', checkForm);
