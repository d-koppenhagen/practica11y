---
id: headless-table
title: 'Headless Table'
difficulty: intermediate
tags:
  - semantics
  - tables
points: 200
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
  - text: 'W3C: Tables Tutorial'
    url: 'https://www.w3.org/WAI/tutorials/tables/'
  - text: 'MDN: Table accessibility'
    url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced'
  - text: 'H63: Using scope to associate headers with data cells'
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H63'
  - text: 'WCAG: 1.3.1 Info and Relationships'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
---

This data table uses only `<td>` elements for everything — including what are clearly headers. The first row is visually styled to look bold, but screen readers cannot identify any headers. Users hear isolated cell values like "1,200" without knowing which product or quarter they belong to.

## Your Task

Fix the table so assistive technology can associate data cells with their headers:

- Convert the first row into proper column headers using `<th scope="col">` inside a `<thead>`
- Convert the first cell of each data row into a row header using `<th scope="row">`
- Wrap the data rows in `<tbody>`
- Add a `<caption>` element that describes the table's purpose

## Tips

- `<th>` elements tell screen readers "this cell is a header" — `<strong>` inside a `<td>` only looks bold visually
- `scope="col"` says "I am a header for this entire column"; `scope="row"` says "I am a header for this row"
- `<caption>` acts as a label for the table — screen readers announce it when users enter the table
- `<thead>` and `<tbody>` help group header rows from data rows semantically
