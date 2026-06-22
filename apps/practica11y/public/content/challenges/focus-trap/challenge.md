---
id: focus-trap
title: 'Escape Room'
difficulty: intermediate
tags:
  - keyboard
  - focus
points: 150
starter:
  html: starter.html
  css: starter.css
validators:
  - focus-trap-implemented
  - keyboard-accessible
links:
  - text: 'APG: Dialog (Modal) Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'
  - text: 'MDN: ARIA: dialog role'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/11'
---

In this challenge you see a modal dialog that is visible but has no focus management. When you navigate through the page with Tab, the focus leaves the dialog — this is a major problem for keyboard users.

## Your Task

Implement a focus trap for the modal dialog so that:

- Focus is moved into the dialog when it opens
- Tab and Shift+Tab keep the focus inside the dialog
- The dialog has the correct ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- The dialog has an accessible name (via `aria-label` or `aria-labelledby`)

## Tips

- Use `role="dialog"` and `aria-modal="true"` on the modal container
- Give the dialog an accessible name with `aria-labelledby` (referencing the heading)
- Add a `keydown` event that traps focus inside the dialog on Tab/Shift+Tab
- Make sure at least one focusable element is present inside the dialog
