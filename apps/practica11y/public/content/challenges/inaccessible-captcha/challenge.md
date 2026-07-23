---
id: inaccessible-captcha
title: "Prove You're Human (Or Not)"
difficulty: intermediate
tags:
  - forms
  - screen-reader
points: 150
createdAt: '2026-07-23'
updatedAt: '2026-07-23'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - accessible-authentication
  - form-labels
links:
  - text: 'WCAG: Accessible Authentication (Minimum)'
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html'
  - text: 'W3C: Inaccessibility of CAPTCHA'
    url: 'https://www.w3.org/TR/turingtest/'
  - text: 'Deque: Accessible Authentication'
    url: 'https://www.deque.com/blog/accessible-authentication/'
---

In this challenge you see a login form that uses a visual image CAPTCHA as the only verification method. Users with visual impairments cannot see the distorted text, users with cognitive disabilities struggle to decode it, and screen readers cannot interpret the image meaningfully. There is no alternative mechanism to complete the authentication step.

This violates WCAG 2.2 SC 3.3.8 "Accessible Authentication (Minimum)" which states that authentication must not rely on cognitive function tests like pattern recognition, image puzzles, or transcription — unless an accessible alternative is provided.

## Your Task

Replace the inaccessible image CAPTCHA with an accessible verification method:

- **Remove the image CAPTCHA** entirely — it relies on a cognitive function test (transcription of distorted text)
- **Provide a copy-paste verification** instead: display a code that users can select and paste into a field (this does not require transcription or memorization)
- **Add proper `autocomplete` attributes** to the username and password fields (`autocomplete="username"` and `autocomplete="current-password"`) so password managers can fill them
- **Label all form fields** properly so they are accessible to screen readers
- **Make the verification code selectable** so users can copy it (use `user-select: all` in CSS)

## Tips

- WCAG 3.3.8 allows verification methods that support copy-paste because they do not require cognitive function tests
- The `<output>` element is semantically appropriate for displaying a generated value
- Use `aria-label` on the verification code element to clarify its purpose for screen reader users
- `autocomplete` attributes help password managers and reduce the need for memorization
- `user-select: all` makes it easy to select the entire code with a single click
