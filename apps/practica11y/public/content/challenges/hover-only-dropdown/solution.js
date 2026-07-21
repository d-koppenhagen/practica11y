const trigger = document.querySelector('.dropdown-trigger');
const menu = document.querySelector('.dropdown-menu');
const menuItems = menu.querySelectorAll('[role="menuitem"]');

function openMenu() {
  menu.classList.add('open');
  trigger.setAttribute('aria-expanded', 'true');
  if (menuItems.length > 0) {
    menuItems[0].focus();
  }
}

function closeMenu(restoreFocus) {
  menu.classList.remove('open');
  trigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) {
    trigger.focus();
  }
}

function isOpen() {
  return trigger.getAttribute('aria-expanded') === 'true';
}

// Toggle on click (Enter/Space handled natively by button)
trigger.addEventListener('click', () => {
  if (isOpen()) {
    closeMenu(true);
  } else {
    openMenu();
  }
});

// Keyboard navigation on the trigger
trigger.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    openMenu();
  } else if (e.key === 'Escape' && isOpen()) {
    e.preventDefault();
    closeMenu(true);
  }
});

// Keyboard navigation within the menu
menu.addEventListener('keydown', (e) => {
  const currentIndex = Array.from(menuItems).indexOf(document.activeElement);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (currentIndex < menuItems.length - 1) {
        menuItems[currentIndex + 1].focus();
      } else {
        menuItems[0].focus();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (currentIndex > 0) {
        menuItems[currentIndex - 1].focus();
      } else {
        menuItems[menuItems.length - 1].focus();
      }
      break;
    case 'Escape':
      e.preventDefault();
      closeMenu(true);
      break;
    case 'Tab':
      closeMenu(false);
      break;
  }
});

// Close when focus leaves the dropdown entirely
document.querySelector('.dropdown').addEventListener('focusout', (e) => {
  const dropdown = document.querySelector('.dropdown');
  // Use setTimeout to let the new focus target settle
  setTimeout(() => {
    if (!dropdown.contains(document.activeElement)) {
      closeMenu(false);
    }
  }, 0);
});
