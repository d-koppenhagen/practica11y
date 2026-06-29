---
id: no-skip-link
title: 'No Shortcut Home'
difficulty: intermediate
tags:
  - keyboard
  - navigation
points: 125
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - has-skip-link
links:
  - text: 'WCAG: Bypass Blocks'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html'
  - text: 'WebAIM: Skip Navigation Links'
    url: 'https://webaim.org/techniques/skipnav/'
  - text: 'Deque: bypass'
    url: 'https://dequeuniversity.com/rules/axe/4.10/bypass'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/13'
---

In this challenge you see a page with a long navigation bar. Keyboard users must tab through every single navigation link before reaching the main content. There is no way to skip the navigation.

## Your Task

Add a skip link so that keyboard users can jump directly to the main content:

- The skip link should be the first focusable element on the page
- It should be visually hidden by default but become visible on focus
- The target should be the main content area
- The main content should be focusable (use `tabindex="-1"`)

## Tips

- Place the skip link as the first child inside `<body>` (or at the top of the document)
- Use CSS to visually hide the link (but keep it accessible to screen readers)
- On `:focus`, make it visible with positioning
- The `href` should point to an `id` on the main content
- Don't use `display: none` or `visibility: hidden` — these hide from screen readers too
