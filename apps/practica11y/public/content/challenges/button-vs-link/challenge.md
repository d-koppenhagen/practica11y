---
id: button-vs-link
title: 'Click Bait'
difficulty: beginner
tags:
  - semantics
  - keyboard
points: 100
starter:
  html: starter.html
  js: starter.js
  css: starter.css
solution:
  html: solution.html
validators:
  - button-link-semantics
links:
  - text: 'MDN: The Anchor element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a'
  - text: 'MDN: The Button element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button'
  - text: 'Deque: Links vs. Buttons'
    url: 'https://www.deque.com/blog/links-buttons-submits-divs/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/14'
---

In this challenge, buttons and links are used incorrectly. Buttons are used for navigation (going to a different page), and links are used for actions (adding to cart). This confuses assistive technology and keyboard users.

## Your Task

Fix the semantic elements so that:

- Navigation (going to a different page) uses `<a>` elements with a proper `href`
- Actions (like "Add to Cart") use `<button>` elements
- All interactive elements remain keyboard-accessible

## Tips

- **Rule of thumb:** `<a>` is for navigation (takes you somewhere), `<button>` is for actions (does something)
- Links should have a meaningful `href` attribute — not `href="#"`
- Buttons should not use `location.href` for navigation
- Screen readers announce "link" vs "button" differently, which helps users understand the expected behavior
