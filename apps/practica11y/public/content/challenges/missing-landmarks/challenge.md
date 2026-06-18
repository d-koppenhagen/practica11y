---
id: missing-landmarks
title: 'Lost Without a Map'
difficulty: beginner
tags:
  - semantics
  - navigation
points: 100
starter:
  html: starter.html
  css: starter.css
validators:
  - has-all-landmarks
links:
  - text: 'MDN: Document and website structure'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure'
  - text: 'APG: Landmarks'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/'
  - text: 'Deque: Landmark Regions'
    url: 'https://dequeuniversity.com/rules/axe/4.10/landmark-one-main'
---

In this challenge you see a page structure built entirely with `<div>` elements and CSS classes. Screen reader users cannot navigate the page structure because landmarks are missing.

## Your Task

Replace the generic `<div>` containers with appropriate semantic HTML landmark elements so that:

- Screen readers can identify the page regions (header, navigation, main content, footer)
- Users can jump between landmarks using screen reader shortcuts
- The page structure is meaningful without visual styling

## Tips

- Use `<header>` for the page header area
- Use `<nav>` for navigation sections
- Use `<main>` for the primary page content
- Use `<footer>` for the page footer
- Use `<aside>` for complementary content (like sidebars)
- Each page should have only one `<main>` element
