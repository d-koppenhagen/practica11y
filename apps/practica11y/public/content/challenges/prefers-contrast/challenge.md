---
id: prefers-contrast
title: 'High Contrast'
difficulty: intermediate
tags:
  - visual
  - media-query
points: 150
createdAt: '2025-07-19'
updatedAt: '2025-07-19'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - axe-no-violations
  - prefers-contrast
links:
  - text: 'MDN: prefers-contrast'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast'
  - text: 'WCAG 1.4.11: Non-text Contrast'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html'
  - text: 'web.dev: prefers-contrast'
    url: 'https://web.dev/articles/prefers-contrast'
---

This pricing card uses subtle visual patterns common in modern UI: barely-visible borders, soft box-shadows for depth, ghost buttons with faint outlines, and a badge with no border. Users who prefer increased contrast may struggle to perceive where one element ends and another begins.

## Your Task

Add a `prefers-contrast: more` media query to make all visual boundaries sharp and unambiguous for high-contrast users.

- Replace subtle card shadow with a solid, visible border
- Strengthen the separator lines between feature list items
- Add clear borders to both buttons (primary and ghost)
- Give the badge a visible border
- Underline links for non-color identification

## Tips

- Use `@media (prefers-contrast: more) { ... }` to target users who prefer high contrast
- Replace decorative `box-shadow` with solid `border` for clear boundaries
- Use `border: 2px solid #000` for maximum clarity
- Ensure ALL interactive elements have visible boundaries, not just the primary button
- Links should be identifiable without relying solely on color — add `text-decoration: underline`
- You can test this using the simulation controls in the preview panel
