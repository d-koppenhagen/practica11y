---
id: focus-outline-removed
title: 'Out of Focus'
difficulty: beginner
tags:
  - keyboard
  - focus
points: 75
createdAt: '2026-06-18'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - focus-visible
  - keyboard-accessible
links:
  - text: 'WCAG: Focus Visible'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html'
  - text: 'MDN: :focus-visible'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible'
  - text: 'Deque: Focus Indicator'
    url: 'https://dequeuniversity.com/rules/axe/4.10/focus-order-semantics'
  - text: 'Sara Soueidan: A guide to designing accessible focus indicators'
    url: 'https://www.sarasoueidan.com/blog/focus-indicators/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/15'
---

In this challenge, the CSS removes all focus outlines from interactive elements. When navigating with the keyboard (Tab key), there is no visible indicator of which element currently has focus. Keyboard users are completely lost.

## Your Task

Fix the CSS to provide visible focus indicators so that:

- All interactive elements (inputs, buttons, links) show a visible focus ring when focused via keyboard
- Use `:focus-visible` to only show focus styles for keyboard users (not mouse clicks)
- The focus indicator has sufficient contrast and is clearly visible

## Tips

- Remove or replace the `outline: none` / `outline: 0` rules
- Use `:focus-visible` instead of `:focus` to avoid showing outlines on mouse clicks
- A common pattern: `outline: 2px solid #2563eb; outline-offset: 2px;`
- Alternatively, use `box-shadow` for more design flexibility
- Never remove focus indicators without providing an alternative
