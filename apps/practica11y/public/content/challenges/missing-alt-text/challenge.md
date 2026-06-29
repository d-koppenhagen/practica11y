---
id: missing-alt-text
title: 'A Picture Says Nothing'
difficulty: beginner
tags:
  - images
points: 75
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - image-alt-text
links:
  - text: 'MDN: Images in HTML'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Images_in_HTML'
  - text: 'WCAG: Non-text Content'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
  - text: 'Deque: Image Alt Text'
    url: 'https://dequeuniversity.com/rules/axe/4.10/image-alt'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/8'
---

In this challenge you see an image that has no alternative text (`alt` attribute). Without alt text, screen readers cannot convey the image content — blind users won't know what is being displayed.

## Your Task

Add a meaningful alt text for the image so that:

- Screen readers can describe the image content
- When the image fails to load, an alternative text is displayed
- Search engines can understand the content of the image

## Tips

- Use the `alt` attribute with a short, concise description of the image content
- The alt text should describe the purpose or content of the image, not just say "image"
- Decorative images (without informational content) can receive an empty `alt=""` — but this image is meaningful
