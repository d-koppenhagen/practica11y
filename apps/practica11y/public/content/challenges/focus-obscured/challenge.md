---
id: focus-obscured
title: 'Behind the Curtain'
difficulty: intermediate
tags:
  - keyboard
  - focus
points: 150
createdAt: '2026-07-23'
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - focus-not-obscured
links:
  - text: 'WCAG 2.4.11: Focus Not Obscured (Minimum)'
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html'
  - text: 'Sara Soueidan: A guide to designing accessible focus indicators'
    url: 'https://www.sarasoueidan.com/blog/focus-indicators/'
  - text: 'MDN: scroll-padding'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding'
  - text: 'MDN: scroll-margin'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin'
---

This page has a sticky header navigation and a fixed cookie consent banner at the bottom. When a keyboard user tabs through the page, focused elements near the top or bottom edges are completely obscured by these fixed-position overlays. The user cannot see where their focus is — defeating the purpose of having a visible focus indicator.

This violates WCAG 2.2 SC 2.4.11 "Focus Not Obscured (Minimum)" which requires that focused elements are not entirely hidden by author-created content.

## Your Task

Fix the CSS so that focused elements are never hidden behind the sticky header or the cookie banner:

- Add `scroll-padding` to account for the fixed header and footer heights
- Add `scroll-margin` to interactive elements so they remain visible when focused
- Ensure sufficient spacing so the focus indicator itself is not clipped by the overlays
- Use `:focus-visible` instead of `:focus` for the focus indicator styles

## Tips

- `scroll-padding-top` on `html` reserves space at the top for the sticky header when the browser scrolls to a focused element
- `scroll-padding-bottom` reserves space at the bottom for the cookie banner
- `scroll-margin` on individual elements achieves a similar effect and has broader support for focus scrolling
- Add a few extra pixels beyond the overlay height to account for the `outline-offset` of the focus ring
- The main content also needs enough `margin-top` and `margin-bottom` so it does not sit behind the overlays initially
