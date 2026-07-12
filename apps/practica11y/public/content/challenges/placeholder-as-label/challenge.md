---
id: placeholder-as-label
title: 'Now You See Me...'
difficulty: beginner
tags:
  - forms
points: 75
createdAt: '2026-06-18'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - form-labels
links:
  - text: 'MDN: The Label element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label'
  - text: 'MDN: The placeholder attribute'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#placeholder'
  - text: 'Deque: Placeholder as Label'
    url: 'https://www.deque.com/blog/accessible-forms-the-problem-with-placeholders/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/24'
---

In this challenge you see a form that uses placeholder text as the only indicator of what should be entered. Once users start typing, the placeholder disappears and they can't remember what the field is for. Screen readers may not reliably announce placeholders as the field's accessible name.

## Your Task

Add proper labels for all form fields so that:

- Each field has a visible `<label>` element
- The label text clearly describes what should be entered
- Placeholders can remain as hints (e.g., "e.g. Berlin") but are not the only label
- Screen readers announce the label when focusing a field

## Tips

- Use `<label for="id">` with a matching `id` on the input
- Placeholders disappear when you type — they are not a substitute for labels
- Screen readers don't always announce placeholder text
- Users with cognitive disabilities may forget what a field needs once the placeholder is gone
- Keep the placeholder for examples or hints, but always provide a label too
