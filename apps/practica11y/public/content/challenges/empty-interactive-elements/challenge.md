---
id: empty-interactive-elements
title: 'Icon Mute'
difficulty: beginner
tags:
  - aria
  - semantics
points: 100
createdAt: '2026-06-30'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - interactive-element-name
links:
  - text: 'MDN: aria-label'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label'
  - text: 'Deque: button-name'
    url: 'https://dequeuniversity.com/rules/axe/4.10/button-name'
  - text: 'Deque: link-name'
    url: 'https://dequeuniversity.com/rules/axe/4.10/link-name'
  - text: 'WebAIM Million Report'
    url: 'https://webaim.org/projects/million/'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

In this challenge, icon-buttons and icon-links have no accessible name. A `<button>` containing only an SVG icon or an `<a>` wrapping only an `<i class="icon-search">` will be announced by screen readers as just "button" or "link" — without telling the user what the element does.

According to the WebAIM Million Report, empty links affect ~45% and empty buttons ~30% of all tested pages.

## Your Task

Make all interactive elements accessible by giving them a meaningful name:

- Add `aria-label` to buttons and links that contain only icons
- Add `alt` text to images used as the sole content of a link

## Tips

- `aria-label` provides an accessible name directly on the element
- An `<img>` with a meaningful `alt` attribute acts as the accessible name for its parent link
- Every `<button>` and `<a>` must be perceivable — a screen reader user must know what it does
- **Bonus:** Mark decorative icons with `aria-hidden="true"` so screen readers skip the meaningless SVG content — this is not required to pass but is considered best practice
