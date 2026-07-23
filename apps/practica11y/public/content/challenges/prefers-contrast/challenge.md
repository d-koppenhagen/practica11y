---
id: prefers-contrast
title: 'High Contrast'
difficulty: intermediate
tags:
  - visual
  - user-preferences
points: 150
createdAt: '2026-07-19'
updatedAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - axe-no-violations
  - prefers-contrast
  - section-accessible-name
links:
  - text: 'MDN: prefers-contrast'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast'
  - text: 'WCAG 1.4.11: Non-text Contrast'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html'
  - text: 'web.dev: prefers-contrast'
    url: 'https://web.dev/articles/prefers-contrast'
  - text: 'Sara Soueidan: A guide to designing accessible focus indicators'
    url: 'https://www.sarasoueidan.com/blog/focus-indicators/'
---

This pricing card uses subtle visual patterns common in modern UI: barely-visible borders, soft box-shadows for depth, ghost buttons with faint outlines, and a badge with no border. Users who prefer increased contrast may struggle to perceive where one element ends and another begins. The disclaimer text is too faint and the link relies solely on color.

## Your Task

Fix the base accessibility issues and add a `prefers-contrast: more` media query to make all visual boundaries sharp and unambiguous for high-contrast users.

- Fix the disclaimer text contrast to meet WCAG AA (4.5:1 ratio)
- Underline the disclaimer link so it does not rely solely on color
- Add a `@media (prefers-contrast: more)` block that:
  - Replaces the subtle card shadow with a solid, visible border
  - Strengthens the separator lines between feature list items
  - Adds clear borders to both buttons (primary and ghost)
  - Gives the badge a visible border
  - Further strengthens disclaimer text and link contrast

## Tips

- The disclaimer text color `#9ca3af` only has ~2.9:1 contrast on white — use `#6b7280` or darker for 4.5:1
- Links in text blocks must be identifiable without relying solely on color — add `text-decoration: underline`
- Use `@media (prefers-contrast: more) { ... }` to target users who prefer high contrast
- Replace decorative `box-shadow` with solid `border` for clear boundaries
- Use `border: 2px solid #000` for maximum clarity inside the high-contrast query
- Ensure ALL interactive elements have visible boundaries, not just the primary button
- Use `text-decoration-thickness: 2px` for extra emphasis in high contrast mode
- You can test this using the simulation controls in the preview panel
