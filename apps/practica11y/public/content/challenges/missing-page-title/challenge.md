---
id: missing-page-title
title: 'The Nameless Page'
difficulty: beginner
tags:
  - spa
  - semantics
points: 75
previewTitle: 'MyPage'
starter:
  html: starter.html
  js: starter.js
  css: starter.css
solution:
  js: solution.js
validators:
  - page-title
links:
  - text: 'WCAG: Page Titled'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html'
  - text: 'MDN: The Document Title element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title'
  - text: 'Deque: document-title'
    url: 'https://dequeuniversity.com/rules/axe/4.10/document-title'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/17'
---

In this challenge you see a single-page application called "MyPage" where the `document.title` never changes when navigating between pages. All browser tabs look the same, and screen readers always announce the same generic title regardless of which page the user is on.

## Your Task

Update the JavaScript to set a unique, descriptive `document.title` for each page so that:

- Screen readers announce the correct page name when navigation occurs
- Browser tabs are distinguishable
- Users always know which page they are on

The title should follow a pattern like:

- **Home**: `Home - MyPage` or `Home | MyPage` or just `MyPage`
- **About**: `About - MyPage` or `About | MyPage`
- **Contact**: `Contact - MyPage` or `Contact | MyPage`

The most specific information (page name) should come first, followed by the app name.

## Tips

- Update `document.title` inside your `navigate()` function
- Use the app name "MyPage" from the header
- The page-specific part should come first (e.g., "About - MyPage" not "MyPage - About")
- This is especially important for SPAs where no full page reload occurs
