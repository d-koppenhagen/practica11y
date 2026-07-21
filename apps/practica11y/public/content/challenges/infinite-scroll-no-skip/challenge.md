---
id: infinite-scroll-no-skip
title: 'Scroll of No Return'
difficulty: advanced
tags:
  - keyboard
  - navigation
  - semantics
points: 250
createdAt: '2026-07-21'
starter:
  html: starter.html
  css: starter.css
  js: starter.js
solution:
  html: solution.html
  css: solution.css
  js: solution.js
validators:
  - color-contrast
  - axe-no-violations
  - infinite-scroll-bypass
links:
  - text: 'WCAG: Keyboard (2.1.1)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
  - text: 'WCAG: Bypass Blocks (2.4.1)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html'
  - text: 'ARIA APG: Feed Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/'
  - text: 'Deque: Infinite Scrolling & Accessibility'
    url: 'https://www.deque.com/blog/infinite-scrolling-rollercoaster-web-accessibility/'
---

This page uses infinite scroll to load articles as the user scrolls down. Keyboard users who Tab through the feed get trapped in an endless stream of items — they can never reach the footer or any content after the feed. There is no mechanism to skip past the infinite-scroll region, and no way to pause the automatic loading.

## Your Task

Fix the infinite scroll so keyboard and screen reader users can navigate past it:

- Add a "Skip to footer" link before the feed that allows keyboard users to bypass the feed region
- Wrap the feed in a `<section>` with an accessible name (e.g. `aria-label`) so screen reader users can identify and skip it via landmark navigation
- Replace the automatic infinite scroll with a "Load more" button that gives users control over when new content loads

## Tips

- The skip link should target the `#site-footer` element that already exists
- Use `role="feed"` or a `<section>` with `aria-label` to make the feed region a navigable landmark
- A "Load more" button is more accessible than auto-loading because it gives users explicit control
- Remove the scroll event listener and replace it with a click handler on the button
- Consider setting `aria-busy` on the feed while new content is loading
