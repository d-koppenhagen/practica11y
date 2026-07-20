---
id: missing-document-language
title: 'Lost in Pronunciation'
difficulty: beginner
tags:
  - semantics
  - i18n
points: 75
createdAt: '2026-07-04'
starter:
  html: starter.html
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - document-language
links:
  - text: 'MDN: lang attribute'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang'
  - text: 'WCAG: Language of Page'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
  - text: 'WCAG: Language of Parts'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts.html'
  - text: 'Deque: html-has-lang'
    url: 'https://dequeuniversity.com/rules/axe/4.10/html-has-lang'
---

In this challenge you see a recipe blog page written in English. The HTML document is missing a `lang` attribute on the `<html>` element, and it contains inline quotes in French and Spanish that are not marked up with their respective languages. Screen readers cannot load the correct speech synthesis and will read all text with wrong pronunciation rules (e.g. French text read with English phonetics). According to the WebAIM Million Report, approximately 16% of all pages have this issue.

## Your Task

Fix the document so that assistive technologies can correctly identify languages:

- Add a `lang` attribute to the `<html>` element to declare the document's primary language (English)
- Mark up the French quote with a `lang` attribute on its containing element
- Mark up the Spanish quote with a `lang` attribute on its containing element

## Tips

- The `lang` attribute uses BCP 47 language tags (e.g. `en`, `fr`, `es`, `de`)
- Set the document language on the `<html>` element itself
- For inline language changes, add `lang` to the closest containing element (e.g. the `<blockquote>`)
- This helps screen readers switch pronunciation, improves browser translation, and aids search engines
