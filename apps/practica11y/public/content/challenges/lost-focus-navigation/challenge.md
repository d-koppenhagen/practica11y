---
id: lost-focus-navigation
title: 'Ghost Cursor'
difficulty: intermediate
tags:
  - focus
  - keyboard
  - spa
points: 150
starter:
  html: starter.html
  js: starter.js
  css: starter.css
validators:
  - focus-after-navigation
links:
  - text: 'MDN: Managing focus in accessibility'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Focus_management'
  - text: 'MDN: aria-current'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current'
  - text: 'Deque: Focus Management in SPAs'
    url: 'https://www.deque.com/blog/accessible-client-side-routing/'
---

In this challenge you see a single-page application (SPA) with client-side navigation. When you click a navigation link, the page content updates — but the focus stays on the navigation link. Screen reader users don't know that new content appeared, and they can't tell which page is currently active.

## Your Task

Fix the focus management and navigation state so that after navigation:

- Focus is moved to the main content area (or its heading)
- Screen readers announce the new content
- The currently active page is indicated with `aria-current="page"` on the corresponding navigation link

## Tips

- After updating the content, set focus programmatically to the new content area or heading
- Use `tabindex="-1"` on the target element to make it focusable without adding it to the tab order
- Call `.focus()` on the element after the content update
- Set `aria-current="page"` on the active link and remove it from all other links — the CSS already styles `[aria-current="page"]`
- This is a common SPA problem — in traditional multi-page apps, the browser handles this automatically
