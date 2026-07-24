---
id: non-descriptive-link-text
title: 'Click Here If You Dare'
difficulty: beginner
tags:
  - semantics
  - navigation
  - screen-reader
points: 100
createdAt: '2026-07-24'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - descriptive-link-text
links:
  - text: 'WCAG: Understanding Link Purpose (In Context)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
  - text: 'Deque: Links must have discernible text'
    url: 'https://dequeuniversity.com/rules/axe/4.10/link-name'
  - text: 'MDN: Accessible link text'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#accessibility'
  - text: 'WebAIM: Links and Hypertext'
    url: 'https://webaim.org/techniques/hypertext/link_text'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

This blog page uses generic link text like "Click here", "Read more", and "Learn more" for every link. Sighted users can rely on surrounding context, but screen reader users who navigate via the links list (rotor) hear a list of identical, meaningless phrases with no indication of where each link leads.

Non-descriptive link text violates WCAG 2.4.4 (Link Purpose — In Context) at Level A, and prevents assistive technology users from efficiently navigating or understanding the page structure.

## Your Task

Fix all three links so that each has a unique, descriptive accessible name. Use a different technique for each one to practice multiple approaches:

1. **Descriptive visible text** — rewrite the link text itself so it describes the destination (e.g. "Read the web accessibility basics guide")
2. **`aria-label`** — keep the short visible text but add an `aria-label` attribute with a descriptive name for screen readers
3. **`aria-labelledby`** — compose the accessible name from multiple elements (e.g. combine the link text with the article heading using their IDs)

Each link's accessible name must be unique and clearly communicate its destination.

## Tips

- Screen readers allow users to pull up a list of all links on the page — if they all say "Click here", the list is useless
- Good link text answers the question: "Where does this link take me?" or "What will happen when I activate it?"
- Descriptive visible text benefits everyone: it improves scannability for sighted users too
- `aria-label` overrides visible text for screen readers — use it when you cannot change the visible text but need a better accessible name
- `aria-labelledby` can reference multiple element IDs (space-separated) to build a composite label — e.g. `aria-labelledby="link-id heading-id"` produces "Read more Keyboard Navigation Best Practices"
- The heading in the third article already has `id="post-keyboard"` — you can reference it
