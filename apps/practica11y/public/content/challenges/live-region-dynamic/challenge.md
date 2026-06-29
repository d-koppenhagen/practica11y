---
id: live-region-dynamic
title: 'Breaking News'
difficulty: intermediate
tags:
  - aria
  - screen-reader
points: 200
starter:
  html: starter.html
  js: starter.js
  css: starter.css
solution:
  html: solution.html
  js: solution.js
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - keyboard-accessible
  - live-region-pattern
links:
  - text: 'MDN: aria-live'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live'
  - text: 'MDN: ARIA live regions'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions'
  - text: 'Deque: aria-live'
    url: 'https://dequeuniversity.com/rules/axe/4.10/aria-live-region'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/18'
---

In this challenge, a notification is created dynamically with `aria-live` set at the same time the content is added. This is a common mistake: screen readers need the live region to already exist in the DOM **before** its content changes. Creating the element and setting `aria-live` simultaneously means the announcement is missed.

## Your Task

Fix the live region pattern so that screen readers reliably announce notifications:

- Create a persistent, empty live region in the HTML (not dynamically)
- When a notification appears, update the live region's text content
- Use `aria-live="polite"` and `aria-atomic="true"` on the persistent region
- Ensure that each new notification is announced

## Tips

- The live region element must exist in the DOM **before** its content changes
- Use a "global announcer" pattern: an empty `<div aria-live="polite" aria-atomic="true">` that's always present
- Update its `textContent` to trigger an announcement
- Use a visually hidden class (`.sr-only`) if the announcements should not be visually shown
- `aria-live="polite"` waits until the user is idle; `"assertive"` interrupts immediately (use sparingly)
