---
id: target-size-too-small
title: 'Fat Finger Fiasco'
difficulty: beginner
tags:
  - interaction
  - motor
points: 100
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - target-size-minimum
  - interactive-element-name
links:
  - text: 'WCAG: Target Size (Minimum)'
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html'
  - text: 'APG: Target Size'
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/target-size/'
  - text: 'Adrian Roselli: Target Size'
    url: 'https://adrianroselli.com/2019/06/target-size-and-2-5-5.html'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

In this challenge, small interactive elements — close buttons on tags, pagination links, and social media icon links — all have click/tap targets smaller than the required 24×24 CSS pixels. Touch users and people with motor impairments cannot reliably hit these targets.

WCAG 2.2 Success Criterion 2.5.8 "Target Size (Minimum)" (Level AA) requires that interactive targets be at least 24×24 CSS pixels, or have sufficient spacing around them so that the 24px circle centered on the target does not overlap another target.

## Your Task

Fix all interactive elements so they meet the minimum target size requirement:

- Ensure the tag close buttons (×) have at least 24×24px target area
- Ensure the pagination links have at least 24×24px target area
- Ensure the social media icon links have at least 24×24px target area
- Add accessible names to elements that are missing them (icon links, close buttons)

## Tips

- Use `min-width` and `min-height` to guarantee a minimum target size
- Increase `padding` to enlarge the clickable area
- `display: inline-flex` with `align-items: center` and `justify-content: center` is great for icon targets
- Remember that accessible names (via `aria-label`) are still needed for icon-only links and close buttons
