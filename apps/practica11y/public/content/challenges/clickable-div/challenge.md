---
id: clickable-div
title: 'Div and Conquer'
difficulty: beginner
tags:
  - semantics
  - keyboard
points: 100
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - semantic-button
  - keyboard-accessible
links:
  - text: 'MDN: The Button element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button'
  - text: 'APG: Button Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/7'
---

In this challenge you see a `<div>` element styled as a clickable button. The problem: for screen readers and keyboard users, this element is invisible or not operable.

## Your Task

Convert the `<div>` with an `onclick` handler into a semantic `<button>` element so that:

- Screen readers recognize it as an interactive element
- Keyboard users can activate it with Enter/Space
- The focus indicator is visible

## Tips

- Use `<button>` instead of `<div>` for clickable elements
- Remove the `onclick` attribute and use an event listener instead, or keep it — the important thing is that the element is semantically correct
- Make sure the element is reachable via Tab
