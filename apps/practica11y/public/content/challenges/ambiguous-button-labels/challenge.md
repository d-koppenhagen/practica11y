---
id: ambiguous-button-labels
title: 'Edit What Exactly?'
difficulty: beginner
tags:
  - aria
  - semantics
points: 100
createdAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - unique-button-labels
links:
  - text: 'ARIA APG: Providing Accessible Names'
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/'
  - text: 'WCAG: Headings and Labels (2.4.6)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
  - text: 'A11Y Project: How to hide content'
    url: 'https://www.a11yproject.com/posts/how-to-hide-content/'
  - text: 'Deque: Buttons must have discernible text'
    url: 'https://dequeuniversity.com/rules/axe/4.10/button-name'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

This page contains a list of user profile cards, each with an "Edit" and a "Delete" button. While the buttons technically have text, screen reader users navigating via the button list (rotor) hear "Edit", "Edit", "Edit" — with no way to tell which profile each button belongs to.

Identical accessible names on repeated actions violate WCAG 2.4.6 (Headings and Labels) and make it impossible for assistive technology users to distinguish between controls.

## Your Task

Give each button a unique, distinguishing accessible name so that screen reader users can tell which profile each action belongs to:

- Use `aria-label` to provide context (e.g. "Edit Alice's profile")
- Or use `aria-labelledby` referencing the person's name and the button text
- Or add visually hidden text inside the button (e.g. `<span class="sr-only">Alice's profile</span>`)

All buttons of the same type (Edit/Delete) must have **distinct** accessible names.

## Tips

- `aria-label` overrides the visible button text for screen readers — use it to add context
- `aria-labelledby` can combine multiple element IDs to build a composite label (e.g. the person's name + "Edit")
- The visually-hidden pattern uses CSS (`clip`, `position: absolute`, etc.) to hide text visually while keeping it available to assistive technology
- Screen readers present buttons in a list/rotor view — if all say "Edit", users cannot navigate efficiently
