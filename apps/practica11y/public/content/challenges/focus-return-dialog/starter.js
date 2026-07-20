const dialog = document.getElementById('confirm-dialog');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');

let triggerElement = null;

// Open dialog when any delete button is clicked
document.querySelectorAll('.delete-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerElement = btn;
    dialog.hidden = false;
    confirmBtn.focus();
  });
});

function closeDialog() {
  dialog.hidden = true;

}

// Confirm deletion — closes the dialog
confirmBtn.addEventListener('click', () => {
  closeDialog();
});

// Cancel — closes the dialog
cancelBtn.addEventListener('click', () => {
  closeDialog();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !dialog.hidden) {
    closeDialog();
  }
});
