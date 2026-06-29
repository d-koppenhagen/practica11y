---
id: color-contrast-fail
title: 'Fifty Shades of Gray'
difficulty: beginner
tags:
  - visual
  - color
points: 100
starter:
  html: starter.html
  css: starter.css
solution:
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - color-contrast
links:
  - text: 'WCAG: Contrast (Minimum)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
  - text: 'WebAIM: Contrast Checker'
    url: 'https://webaim.org/resources/contrastchecker/'
  - text: 'Deque: Color Contrast'
    url: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/20'
---

In this challenge you see a page where the text color has insufficient contrast against its background. The design looks "modern and minimal" but is hard to read for users with low vision or in bright environments.

## Your Task

Fix the color contrast in the CSS so that:

- All text meets WCAG AA requirements (4.5:1 ratio for normal text, 3:1 for large text)
- The design still looks clean and professional
- Text on colored backgrounds has sufficient contrast

## Tips

- WCAG AA requires a contrast ratio of at least **4.5:1** for normal text and **3:1** for large text (≥18pt or bold ≥14pt)
- Use a contrast checker tool to verify ratios (e.g., WebAIM Contrast Checker)
- Common fixes: darken light text or lighten dark backgrounds
- `#595959` on white gives 7:1 (AAA), `#767676` gives 4.5:1 (AA minimum)
- Watch out for text on colored backgrounds — both directions matter
