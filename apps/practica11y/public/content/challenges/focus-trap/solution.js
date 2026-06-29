const modal = document.querySelector('.modal-overlay');
const focusableEls = modal.querySelectorAll('input, button');
const firstFocusable = focusableEls[0];
const lastFocusable = focusableEls[focusableEls.length - 1];

firstFocusable.focus();

modal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
});
