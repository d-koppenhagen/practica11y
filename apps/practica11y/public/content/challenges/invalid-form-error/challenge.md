---
id: invalid-form-error
title: 'Silent Treatment'
difficulty: advanced
tags:
  - forms
  - aria
points: 200
starter:
  html: starter.html
  js: starter.js
  css: starter.css
solution:
  html: solution.html
  js: solution.js
validators:
  - color-contrast
  - axe-no-violations
  - no-disabled-submit
  - form-labels
  - aria-invalid-errors
  - error-focus-management
links:
  - text: 'MDN: aria-invalid'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid'
  - text: 'MDN: aria-describedby'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby'
  - text: 'APG: Alert Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/'
  - text: "Deque: Don't Disable Submit Buttons"
    url: 'https://www.deque.com/blog/dont-disable-buttons/'
  - text: 'Deque: Form Validation'
    url: 'https://www.deque.com/blog/anatomy-of-accessible-forms-error-messages/'
  - text: 'MDN: Client-side form validation'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/22'
---

In this challenge you see a registration form with two accessibility problems:

1. The submit button is **disabled** with no explanation — keyboard users cannot reach it, and screen reader users get no useful information about why.
2. Validation only uses **visual indicators** (red borders, error text) to communicate errors — there is no programmatic association for assistive technologies.

## Your Task

Fix both problems to make the form fully accessible:

- **Remove the disabled pattern**: Keep the submit button always enabled so it is focusable and operable
- **Mark invalid fields** with `aria-invalid="true"` when validation fails
- **Associate error messages** with their fields using `aria-describedby` (or `aria-errormessage`)
- **Move focus** to the first invalid field after a failed submission
- **Ensure all fields have proper labels** that are programmatically associated

Because the error message is linked with `aria-describedby` and focus moves to the first invalid field, screen readers announce both the invalid state and the message text automatically. Using `role="alert"` on the error message (so it is announced immediately, before focus lands) is a nice enhancement but optional.

## Tips

- Disabled buttons are problematic because they are not focusable via keyboard and provide no explanation
- A better pattern: keep the button enabled, validate on submit, and give specific feedback
- Add `aria-invalid="true"` to fields when they contain errors
- Use `aria-describedby="error-id"` to link error messages to input fields
- After validation, programmatically focus the first invalid field with `.focus()`
- Remove `aria-invalid` when the field is corrected
- Never leave users guessing why something doesn't work
