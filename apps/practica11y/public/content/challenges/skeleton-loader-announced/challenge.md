---
id: skeleton-loader-announced
title: 'Bones of Contention'
difficulty: intermediate
tags:
  - aria
  - screen-reader
points: 200
createdAt: '2026-07-12'
updatedAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - skeleton-aria-hidden
  - section-accessible-name
links:
  - text: 'MDN: aria-busy'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy'
  - text: 'MDN: aria-hidden'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden'
  - text: 'Adrian Roselli: More Accessible Skeletons'
    url: 'https://adrianroselli.com/2020/11/more-accessible-skeletons.html'
  - text: 'Deque: aria-hidden-focus'
    url: 'https://dequeuniversity.com/rules/axe/4.10/aria-hidden-focus'
  - text: 'WCAG 4.1.3: Status Messages'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html'
---

In this challenge, a card list with skeleton loaders is visible while data is being fetched. The skeletons are purely decorative animated placeholders, but they are fully exposed to the accessibility tree. Screen readers will read out meaningless content like repeated "loading" text or empty elements. The container also lacks `aria-busy` to signal that content is still loading.

## Your Task

Fix the skeleton loaders so they are hidden from assistive technology and the loading state is properly communicated:

- Add `aria-hidden="true"` to each skeleton placeholder element so screen readers skip them
- Add `aria-busy="true"` to the container that will receive the real content, signaling that the region is still loading
- Add a visually hidden live region with `role="status"` that announces the loading state to screen reader users

## Tips

- `aria-hidden="true"` removes an element (and all its children) from the accessibility tree
- `aria-busy="true"` on a container tells assistive technology to wait before announcing changes
- A `role="status"` element acts as an implicit `aria-live="polite"` region
- Use a `.sr-only` class to hide the status message visually while keeping it accessible
- The skeleton elements are decorative — they have no semantic meaning and should never be announced
