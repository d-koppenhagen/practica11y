---
id: heading-chaos
title: 'Head Over Levels'
difficulty: beginner
tags:
  - semantics
points: 75
starter:
  html: starter.html
  css: starter.css
validators:
  - heading-structure
links:
  - text: 'MDN: Heading elements'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements'
  - text: 'WCAG: Headings and Labels'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
  - text: 'Deque: Heading Order'
    url: 'https://dequeuniversity.com/rules/axe/4.10/heading-order'
---

In this challenge you see a page with jumbled heading levels. The hierarchy is wrong: levels are skipped and the order doesn't make sense.

## Your Task

Fix the heading hierarchy so that:

- The page starts with an `<h1>`
- No levels are skipped (e.g., no `<h3>` directly after `<h1>`)
- The structure logically reflects the content

## Tips

- Every page should have exactly one `<h1>`
- Subsections use `<h2>`, their subsections use `<h3>`, and so on
- Choose the level based on content structure, not visual appearance
- Use CSS for visual sizing, not incorrect heading levels
