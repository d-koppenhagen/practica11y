---
id: tab-roulette
title: 'Tab Roulette'
difficulty: beginner
tags:
  - keyboard
  - focus
points: 75
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - no-positive-tabindex
links:
  - text: 'MDN: tabindex'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex'
  - text: 'WCAG: Focus Order'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html'
  - text: 'Deque: Positive tabindex'
    url: 'https://dequeuniversity.com/rules/axe/4.10/tabindex'
  - text: 'The A11Y Project: tabindex'
    url: 'https://www.a11yproject.com/posts/how-to-use-the-tabindex-attribute/'
---

This page uses positive `tabindex` values on every interactive element. The focus order jumps around unpredictably instead of following the visual layout. Even the skip link and the `<main>` landmark have wrong tabindex values.

## Your Task

Fix the HTML so focus follows the natural DOM order:

- Remove all positive `tabindex` values from interactive elements (links, buttons)
- The `<main>` element serves as a skip-link target — it should use `tabindex="-1"` so it can receive focus programmatically but is not part of the regular tab sequence
- Do **not** use `tabindex="0"` on the `<main>` element — it is not an interactive widget and should not appear in the tab order

## Tips

- Positive `tabindex` values (1, 2, 3, …) always receive focus before `tabindex="0"` and elements without `tabindex` — this breaks the expected reading order
- Natively interactive elements (`<a>`, `<button>`, `<input>`) are already in the tab order by default — just remove their `tabindex` attribute
- `tabindex="-1"` removes an element from the tab order but allows it to receive focus via JavaScript (or via a skip-link `href` target) — perfect for skip-link landing areas
- `tabindex="0"` adds an element to the natural tab order — only use it for custom interactive widgets

