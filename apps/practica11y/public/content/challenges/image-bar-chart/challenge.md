---
id: image-bar-chart
title: 'Lost in Translation'
difficulty: advanced
tags:
  - images
  - aria
points: 150
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - image-alt-text-limit
  - image-aria-describedby
links:
  - text: 'MDN: aria-describedby'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby'
  - text: 'WCAG: Non-text Content'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
  - text: 'W3C: Complex Images'
    url: 'https://www.w3.org/WAI/tutorials/images/complex/'
  - text: 'Deque: Image Alt Text'
    url: 'https://dequeuniversity.com/rules/axe/4.10/image-alt'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/19'
---

This chart image has an alt text that is far too long. For complex images like charts, the `alt` attribute should provide a brief summary (max 150 characters), while a detailed description belongs in a separate element referenced via `aria-describedby`.

Screen readers read the entire alt text in one go — an overly long alt text makes it hard for users to grasp the key point quickly. The `aria-describedby` pattern allows users to access the full details on demand.

## Your Task

1. Shorten the `alt` text to a **concise summary** (max 150 characters) that conveys the chart's purpose
2. Add an element (e.g. a hidden `<div>` or `<p>`) that contains the **detailed description** of the chart data
3. Link the image to that description using `aria-describedby`

## Tips

- The `alt` attribute should answer: "What does this chart show?" — not list every data point
- Use `aria-describedby` to reference the `id` of the element containing the detailed description
- The detailed description can be visually hidden (e.g. with a CSS class) but must remain in the DOM for screen readers
- Keep `alt` text under 150 characters — longer descriptions belong in `aria-describedby`
- Example pattern: `<img alt="Brief summary" aria-describedby="chart-details">` + `<div id="chart-details">Full description...</div>`
