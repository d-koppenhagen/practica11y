---
id: disabled-submit
title: 'No Clicksgiving'
difficulty: intermediate
tags:
  - forms
  - aria
points: 150
starter:
  html: starter.html
  js: starter.js
  css: starter.css
validators:
  - form-labels
  - keyboard-accessible
  - no-disabled-submit
  - aria-invalid-errors
links:
  - text: "Deque: Don't Disable Submit Buttons"
    url: 'https://www.deque.com/blog/dont-disable-buttons/'
  - text: 'MDN: Client-side form validation'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation'
  - text: 'APG: Alert Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/'
---

In this challenge you see a form with a disabled submit button. The button is grayed out and not focusable, but there is no explanation for the user why it's disabled. Keyboard users cannot even reach the button, and screen reader users get no useful information.

## Your Task

Replace the disabled-button pattern with a better approach:

- Keep the submit button always enabled
- On submit, validate the form and show specific error messages
- Focus the first invalid field after validation fails
- Use `aria-invalid` and `aria-describedby` to communicate errors
- The user should always understand what's wrong and how to fix it

## Tips

- Disabled buttons are problematic because they are not focusable via keyboard
- A better pattern: keep the button enabled, validate on submit, and give specific feedback
- Use `aria-invalid="true"` on invalid fields
- Use `aria-describedby` to link error messages to fields
- Move focus to the first invalid field after failed validation
- Never leave users guessing why something doesn't work
