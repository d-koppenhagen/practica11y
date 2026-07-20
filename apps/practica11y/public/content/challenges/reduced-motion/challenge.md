---
id: reduced-motion
title: 'Chill Out'
difficulty: beginner
tags:
  - visual
  - user-preferences
points: 100
createdAt: '2026-06-18'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - reduced-motion
links:
  - text: 'MDN: prefers-reduced-motion'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion'
  - text: 'WCAG: Animation from Interactions'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html'
  - text: 'WebA11y: Designing With Reduced Motion'
    url: 'https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/21'
---

In this challenge you see a promotional banner that pulses continuously. For users with vestibular disorders or motion sensitivity, such repetitive animations can cause dizziness or nausea.

## Your Task

Add a `prefers-reduced-motion` media query so the pulsing animation stops when the user has enabled "Reduce motion" in their OS settings.

- When `prefers-reduced-motion: reduce` is active, the banner should be static
- The banner must remain visible — just without motion

## Tips

- Use `@media (prefers-reduced-motion: reduce) { ... }` to target users who prefer reduced motion
- Inside the media query, set `animation: none` on the animated element
- Don't hide the banner with `display: none` — it should still be visible
- You can test this by enabling "Reduce motion" in your OS accessibility settings
