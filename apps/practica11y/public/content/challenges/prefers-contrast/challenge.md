---
id: prefers-contrast
title: 'High Contrast'
difficulty: intermediate
tags:
  - visual
  - media-query
points: 150
createdAt: '2026-07-19'
updatedAt: '2026-07-19'
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

In this challenge you see a card component that uses subtle borders and decorative box-shadows. Users who prefer increased contrast may struggle to perceive these low-contrast visual boundaries.

## Your Task

Add a `prefers-contrast: more` media query to strengthen the visual boundaries for users who need higher contrast.

- Strengthen the card border to a solid, high-contrast color
- Remove decorative box-shadows (they add visual noise without helpful information)
- Ensure the button has a visible border or outline
- Make all interactive elements clearly distinguishable from their surroundings

## Tips

- Use `@media (prefers-contrast: more) { ... }` to target users who prefer high contrast
- Inside the media query, adjust `border`, `border-color`, `box-shadow`, or `outline` properties
- Removing `box-shadow` with `box-shadow: none` is a valid approach — shadows often reduce clarity for high-contrast users
- You can test this using the simulation controls in the preview panel
