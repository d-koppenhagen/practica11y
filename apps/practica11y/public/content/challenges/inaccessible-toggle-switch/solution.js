document.querySelectorAll('[role="switch"]').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isChecked = toggle.getAttribute('aria-checked') === 'true';
    toggle.setAttribute('aria-checked', String(!isChecked));
    toggle.classList.toggle('on');
  });
});
