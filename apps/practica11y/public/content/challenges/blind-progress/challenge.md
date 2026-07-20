---
id: blind-progress
title: 'Blind Progress'
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
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - progressbar-accessible
  - section-accessible-name
links:
  - text: 'MDN: <progress> element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress'
  - text: 'MDN: ARIA progressbar role'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role'
  - text: 'WCAG: 4.1.2 Name, Role, Value (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
  - text: 'WCAG: 1.3.1 Info and Relationships (Level A)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
---

A visual progress bar shows file upload completion via CSS width, but it exposes no information to assistive technology. The `<div>` used as the progress indicator has no `role="progressbar"`, no `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen reader users have no idea that a progress indicator exists or what the current value is. Additionally, no visible text equivalent of the percentage is provided.

## Your Task

Make the progress bar accessible to screen readers and provide a visible text equivalent:

- Use the native `<progress>` element or apply `role="progressbar"` with the required ARIA attributes (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`)
- Provide a visible text label showing the current percentage (e.g. "65%")
- Give the progress bar an accessible label describing what it represents (e.g. via `aria-label` or `aria-labelledby`)

## Tips

- The native `<progress>` element has built-in semantics — it automatically exposes the progressbar role and value to assistive technology
- If using `<progress>`, set both the `value` and `max` attributes
- A visible percentage text (e.g. "65%") helps all users, not just screen reader users
- Use `aria-label` to describe what the bar represents (e.g. "File upload progress")
- The visible percentage and the progress value should match
