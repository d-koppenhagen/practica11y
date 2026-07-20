---
id: aria-overload
title: 'No ARIA Is Better Than Bad ARIA'
difficulty: advanced
tags:
  - aria
  - semantics
points: 200
createdAt: '2026-07-20'
updatedAt: '2026-07-20'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - aria-overload
  - section-accessible-name
links:
  - text: 'W3C: Using ARIA — First Rule'
    url: 'https://www.w3.org/TR/using-aria/#firstrule'
  - text: 'ARIA APG: No ARIA is better than bad ARIA'
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/'
  - text: 'Deque: aria-valid-attr-value'
    url: 'https://dequeuniversity.com/rules/axe/4.10/aria-valid-attr-value'
  - text: 'Deque: aria-allowed-role'
    url: 'https://dequeuniversity.com/rules/axe/4.10/aria-allowed-role'
  - text: 'MDN: ARIA roles'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions'
---

This page is littered with unnecessary and incorrect ARIA usage. A `<section>` has `aria-label="Section"` — a redundant label that just repeats the role name. A `<button>` carries `role="menuitem"` — an incorrect role applied outside of any menu context. And `aria-controls` references an ID that does not exist in the DOM.

This creates a confusing, contradictory accessibility tree. Screen readers announce incorrect roles, reference non-existent elements, and provide misleading information — **worse than having no ARIA at all**.

## Your Task

Apply the **First Rule of ARIA**: "If you can use a native HTML element or attribute with the semantics and behavior you require already built in, do that instead of re-purposing an element and adding ARIA."

- Remove redundant `aria-label` attributes that merely repeat the element's role name or provide no additional value
- Remove incorrect `role` attributes that do not match the element's actual behavior and surrounding context
- Remove `aria-controls` attributes that reference IDs not present in the DOM
- Keep only ARIA that provides genuine, meaningful accessibility information

## Tips

- The **First Rule of ARIA** says: prefer native HTML semantics. If an element already communicates its role through its tag name, adding ARIA that restates the same thing is noise
- `role="menuitem"` is only valid inside a `role="menu"` or `role="menubar"` container — using it on a standalone button is semantically incorrect
- `aria-controls` must point to an existing element ID in the same document — a broken reference is worse than no reference
- `aria-label` on a `<section>` is valid when it provides a *unique, descriptive* landmark name — but labeling it "Section" adds nothing
- A `<section>` without an accessible name (`aria-label` or `aria-labelledby`) has the implicit role `generic` — it is not exposed as a `region` landmark. Only a descriptive label promotes it to a landmark. Check the Accessibility Tree view to see this difference
- When in doubt, remove the ARIA. Native semantics plus good content are almost always sufficient
