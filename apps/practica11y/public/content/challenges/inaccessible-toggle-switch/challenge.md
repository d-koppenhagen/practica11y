---
id: inaccessible-toggle-switch
title: 'Flip the Script'
difficulty: intermediate
tags:
  - keyboard
  - aria
points: 150
createdAt: '2026-07-24'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
  js: solution.js
validators:
  - color-contrast
  - axe-no-violations
  - switch-role-accessible
links:
  - text: 'APG: Switch Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/'
  - text: 'Inclusive Components: Toggle Buttons'
    url: 'https://inclusive-components.design/toggle-button/'
  - text: 'WCAG 4.1.2: Name, Role, Value (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
  - text: 'WCAG 2.1.1: Keyboard (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

In this challenge you see a settings page with three visual toggle switches. They look functional — the thumb slides and the color changes on click — but they are built entirely from `<div>` elements with an inline `onclick` handler.

The problem: screen readers see only generic containers with no role, no name, and no state. Keyboard users cannot reach or operate the toggles at all. The only indication of the current value is the visual color change, which is invisible to assistive technology.

## Your Task

Convert each toggle into a proper ARIA switch so that:

- Each toggle uses `role="switch"` with `aria-checked` reflecting its on/off state
- Each toggle has an accessible name (via `aria-labelledby` or `aria-label`) derived from the setting label
- Each toggle is keyboard operable (focusable and toggleable with click, Enter, or Space)
- The visual state (`.on` class) stays in sync with `aria-checked`
- A visible focus indicator is present

## Tips

- Use a `<button>` element — it is natively focusable and handles Enter/Space activation for free
- Add `role="switch"` to indicate the toggle pattern (not `role="checkbox"`)
- Set `aria-checked="false"` or `aria-checked="true"` to communicate the current state
- Connect each toggle to its label with `aria-labelledby` pointing at the label element's `id`
- Button clicks handle Enter/Space automatically, so you only need a `click` event listener to toggle state
- Add a `:focus-visible` style for keyboard users
