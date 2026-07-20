---
id: name-mismatch
title: 'Name Mismatch'
difficulty: intermediate
tags:
  - aria
  - screen-reader
points: 150
createdAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - label-in-name
links:
  - text: 'W3C: Understanding Label in Name (2.5.3)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html'
  - text: 'ARIA APG: Naming — Label in Name'
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/'
  - text: 'Deque: label-content-name-mismatch'
    url: 'https://dequeuniversity.com/rules/axe/4.10/label-content-name-mismatch'
  - text: 'MDN: aria-label'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

This page has buttons and links where the `aria-label` contradicts or does not contain the visible text. For example, a button says "Send" visually but has `aria-label="Submit form data"`.

This violates **WCAG 2.5.3 "Label in Name"** (Level A). Voice control users who say "Click Send" get no match because the accessible name is "Submit form data". Screen reader users also hear a different name than what is visually displayed, creating confusion.

## Your Task

Fix the accessible names so they contain the visible text:

- Remove unnecessary `aria-label` attributes when the visible text already serves as a sufficient accessible name
- Where additional context is needed, ensure the `aria-label` **starts with** or **contains** the visible text verbatim
- Every interactive element's accessible name must include its visible label text

## Tips

- The accessible name of an element (what assistive technology announces) comes from `aria-label`, `aria-labelledby`, or the element's text content — in that priority order
- `aria-label` completely overrides visible text for assistive technology — use it only when the visible text alone is insufficient
- When you do use `aria-label`, the value must contain the visible text as a substring (e.g., visible text "Send" → `aria-label="Send message"` is valid)
- Voice control users rely on speaking the visible text to activate controls — if the accessible name does not contain that text, the command fails
