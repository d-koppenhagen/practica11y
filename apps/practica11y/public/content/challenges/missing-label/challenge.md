---
id: missing-label
title: 'Name That Field'
difficulty: beginner
tags:
  - forms
points: 75
starter:
  html: starter.html
  css: starter.css
validators:
  - form-labels
links:
  - text: 'MDN: The Label element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label'
  - text: 'WCAG: Labels or Instructions'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
  - text: 'Deque: Form Labels'
    url: 'https://dequeuniversity.com/rules/axe/4.10/label'
---

In this challenge you see a form with input fields that have no associated labels. Without labels, screen reader users don't know what information should be entered in a field.

## Your Task

Add labels for all form fields so that:

- Screen readers can announce the purpose of each field
- Users can click on the label to focus the field
- The form inputs are clearly understandable

## Tips

- Use `<label for="id">` together with a matching `id` on the input field
- Alternatively: wrap the input field with a `<label>` element
- Each field needs a unique, descriptive label
- Placeholder text (`placeholder`) is not a substitute for a label
