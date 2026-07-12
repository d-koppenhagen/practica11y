---
id: visual-only-table
title: 'Table for Two (Divs)'
difficulty: intermediate
tags:
  - semantics
  - tables
points: 200
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
  - semantic-table-structure
links:
  - text: 'W3C: H51 — Using table markup for tabular data'
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H51'
  - text: 'ARIA APG: Table Pattern'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/'
  - text: 'MDN: Table basics'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Basics'
  - text: 'WCAG: 1.3.1 Info and Relationships'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
---

This page displays a pricing comparison using styled `<div>` elements with CSS Grid. It looks like a table visually — with rows and columns — but the accessibility tree has no table structure. Screen reader users cannot navigate by row or column, cannot identify headers, and have no way to understand the relationships between data cells and their headings.

## Your Task

Convert the visual-only table into a properly structured data table:

- Use semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` elements
- Mark column headers with `<th scope="col">`
- Mark row headers with `<th scope="row">` where appropriate
- Keep the visual appearance similar using CSS

## Tips

- Visual appearance alone does not convey structure to assistive technology — only semantic elements or ARIA roles do
- Use `<thead>` for the header row and `<tbody>` for the data rows
- The `scope` attribute on `<th>` explicitly associates headers with their data cells
- As an alternative to native table elements, you can use ARIA roles: `role="table"`, `role="row"`, `role="columnheader"`, and `role="cell"` — but native elements are preferred
- A `<caption>` element inside the table provides a label that screen readers announce when entering the table
