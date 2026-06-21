---
id: invalid-form-error
title: 'Silent Treatment'
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
  - aria-invalid-errors
  - error-focus-management
links:
  - text: 'MDN: aria-invalid'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid'
  - text: 'MDN: aria-describedby'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby'
  - text: 'APG: Alert Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/'
  - text: 'Deque: Form Validation'
    url: 'https://www.deque.com/blog/anatomy-of-accessible-forms-error-messages/'
---

In this challenge you see a form with validation that only uses visual indicators (red borders, error text) to communicate errors. Screen reader users cannot detect that a field is invalid or what the error message says, because there is no programmatic association.

## Your Task

Make the form error handling accessible so that:

- Invalid fields are marked with `aria-invalid="true"`
- Error messages are associated with their fields using `aria-describedby` (or `aria-errormessage`)
- After submitting an invalid form, focus moves to the first invalid field
- Screen readers can announce the error state and the error message

Because the error message is linked with `aria-describedby` and focus moves to the first invalid field, screen readers announce both the invalid state and the message text automatically. Using `role="alert"` on the error message (so it is announced immediately, before focus lands) is a nice enhancement but optional.

## Tips

- Add `aria-invalid="true"` to fields when they contain errors
- Use `aria-describedby="error-id"` to link error messages to input fields
- After validation, programmatically focus the first invalid field with `.focus()`
- Remove `aria-invalid` when the field is corrected
- Consider using `role="alert"` on error messages for immediate announcement
