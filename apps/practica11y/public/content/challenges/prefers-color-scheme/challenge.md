---
id: prefers-color-scheme
title: 'Dark Side'
difficulty: beginner
tags:
  - visual
  - user-preferences
points: 100
createdAt: '2026-07-19'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - prefers-color-scheme
links:
  - text: 'MDN: prefers-color-scheme'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme'
  - text: 'WCAG: Use of Color'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html'
  - text: 'web.dev: prefers-color-scheme'
    url: 'https://web.dev/articles/prefers-color-scheme'
---

In this challenge you see a light-themed card component. Users who prefer dark mode will see a bright, potentially glaring interface that does not respect their system preferences.

## Your Task

Add a `prefers-color-scheme: dark` media query so the card adapts to dark mode when the user has enabled it in their OS settings.

- Adjust the card's background color to a dark shade
- Change the text color to a light, readable tone
- Update the border to work well on a dark background
- Make sure the button remains clearly visible and accessible

## Tips

- Use `@media (prefers-color-scheme: dark) { ... }` to target users who prefer dark mode
- Inside the media query, adjust `background-color`, `color`, and `border-color` properties
- Ensure sufficient color contrast (at least 4.5:1 for normal text)
- You can test this using the simulation controls in the preview panel or by switching your OS to dark mode
