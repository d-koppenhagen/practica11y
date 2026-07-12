---
id: layout-table
title: 'Tabled Layout'
difficulty: beginner
tags:
  - semantics
  - tables
points: 100
createdAt: '2026-07-04'
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - no-layout-table
links:
  - text: 'W3C: F46 — Using tables for layout'
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/failures/F46'
  - text: 'MDN: CSS Grid Layout'
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout'
  - text: 'WebAIM: Creating Accessible Tables'
    url: 'https://webaim.org/techniques/tables/'
  - text: 'WCAG: 1.3.1 Info and Relationships'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
---

This page uses `<table>`, `<tr>`, and `<td>` elements purely for visual layout — arranging a two-column page with a sidebar and main content area. Screen readers announce this as a data table, telling users "Table with 3 rows and 2 columns" and enabling table navigation shortcuts. But the content is not tabular data — it is simply arranged visually in columns.

## Your Task

Replace the layout table with modern CSS layout techniques:

- Remove the `<table>`, `<tr>`, and `<td>` elements
- Use semantic HTML elements (`<div>`, `<main>`, `<aside>`, etc.) for the page structure
- Use CSS Grid or Flexbox to achieve the same two-column layout

## Tips

- `<table>` elements communicate "this is structured data" to assistive technology
- CSS Grid (`display: grid`) or Flexbox (`display: flex`) can create any layout without adding false semantics
- If you absolutely must keep a table for layout (legacy reasons), adding `role="presentation"` or `role="none"` suppresses the table semantics — but replacing with CSS is the preferred solution
- Think about which semantic elements best describe the content (e.g., `<aside>` for a sidebar, `<main>` for primary content)
