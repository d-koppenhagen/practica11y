---
id: focus-return-dialog
title: 'Where Was I?'
difficulty: intermediate
tags:
  - keyboard
  - focus
points: 150
createdAt: '2026-07-20'
updatedAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
  js: starter.js
solution:
  js: solution.js
validators:
  - color-contrast
  - axe-no-violations
  - focus-return-after-dialog
links:
  - text: 'APG: Dialog (Modal) Pattern — Focus on Close'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'
  - text: 'MDN: HTMLElement.focus()'
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus'
  - text: 'W3C: Understanding Focus Order (2.4.3)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html'
---

A product page has "Delete item" buttons that open a custom confirmation dialog. When the dialog is closed (either by confirming or cancelling), focus is not returned to the button that triggered the dialog.

Keyboard and screen reader users completely lose their place on the page and must navigate from the beginning to find where they were.

## Your Task

Fix the JavaScript so that focus is returned to the triggering element when the dialog is closed:

- Save a reference to the element that opened the dialog
- When the dialog is closed (confirm, cancel, or Escape key), restore focus to that saved reference

## Tips

- Store the trigger element before or when the dialog opens (e.g., the button itself)
- After hiding the dialog, call `.focus()` on the stored trigger element
- A shared `closeDialog()` function helps ensure all close paths return focus consistently
