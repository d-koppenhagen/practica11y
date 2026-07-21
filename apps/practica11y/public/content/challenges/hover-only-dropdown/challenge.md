---
id: hover-only-dropdown
title: 'Hover and Seek'
difficulty: intermediate
tags:
  - keyboard
  - aria
points: 150
createdAt: '2026-07-21'
starter:
  html: starter.html
  css: starter.css
  js: starter.js
solution:
  html: solution.html
  css: solution.css
  js: solution.js
validators:
  - color-contrast
  - axe-no-violations
  - hover-dropdown-accessible
links:
  - text: 'APG: Menu Button Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/'
  - text: 'MDN: Keyboard-navigable JavaScript widgets'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets'
  - text: 'WCAG 2.1.1: Keyboard (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
  - text: 'WCAG 1.3.1: Info and Relationships (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
---

In this challenge you see a navigation bar with a dropdown menu that only opens when you hover over it with a mouse. Keyboard-only users and touch-device users cannot access the menu items at all because there is no focus, click, or keydown handler to trigger the dropdown. The trigger element is a `<span>` instead of a `<button>` and has no `aria-expanded` state.

## Your Task

Make the dropdown menu fully keyboard-accessible:

- Change the trigger element to a `<button>` so it is focusable and has button semantics
- Add `aria-expanded` to the trigger to communicate whether the menu is open or closed
- Add `aria-haspopup="true"` to the trigger to indicate it controls a popup menu
- Open the menu on Enter/Space (or click) and close it on Escape
- Allow arrow key navigation within the menu items
- Close the menu when focus leaves the widget entirely

## Tips

- Use a `<button>` element for the trigger — it is natively focusable and activatable with Enter/Space
- Set `aria-expanded="false"` initially and toggle it to `"true"` when the menu opens
- Listen for `keydown` events: ArrowDown/ArrowUp to move between items, Escape to close
- Use `role="menu"` on the dropdown list and `role="menuitem"` on each item
- Ensure menu items are focusable (e.g. via `tabindex="-1"`) so arrow keys can move focus to them
