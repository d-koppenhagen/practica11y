---
id: sort-filter-table
title: 'Table Manners'
difficulty: advanced
tags:
  - aria
  - semantics
  - tables
  - screen-reader
points: 300
starter:
  html: starter.html
  js: starter.js
  css: starter.css
solution:
  html: solution.html
  js: solution.js
  css: solution.css
validators:
  - color-contrast
  - axe-no-violations
  - semantic-table-structure
  - sortable-table-aria
  - live-region-pattern
links:
  - text: 'ARIA APG: Sortable Table Example'
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/'
  - text: 'MDN: aria-sort'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort'
  - text: 'WCAG 1.3.1: Info and Relationships'
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships'
  - text: 'Deque: Creating Accessible Tables'
    url: 'https://www.deque.com/blog/creating-accessible-tables/'
  - text: 'A11y is Everything: Sortable Data Tables'
    url: 'https://www.a11yiseverything.com/articles/sortable-data-tables/'
---

This sortable and filterable table works fine visually — you can click column headers to sort and type to filter results. But it's built entirely with `<div>` elements. Screen readers cannot identify the table structure, cannot determine which column is sorted or in what direction, and receive no feedback when the content changes after sorting or filtering.

## Your Task

Make the table fully accessible without breaking the existing sort and filter functionality:

- Replace the `<div>`-based layout with proper semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements
- Add a `<caption>` to describe the table's purpose
- Add `aria-sort` attributes to sortable column headers to convey the current sort direction (`none`, `ascending`, or `descending`)
- Wrap sortable header text in `<button>` elements so they are keyboard-operable and identified as interactive controls
- Add a **visually hidden live region** that announces sort changes (e.g. "Sorted by Name, ascending") when a column is sorted
- Add `aria-live="polite"` with `aria-atomic="true"` to the status text so screen readers announce the filtered result count
- Update the JavaScript to target the new semantic elements and maintain `aria-sort` state

## Tips

- `aria-sort` goes on the `<th>` element, not the button. Valid values are `none`, `ascending`, `descending`
- Only the currently sorted column should have `aria-sort="ascending"` or `aria-sort="descending"` — all others should be `none`
- The sort announcer live region must be empty on page load — only populate it when the user triggers a sort. This prevents the screen reader from reading it on initial render
- Use a visually hidden class (e.g. `.sr-only`) for the sort announcer so it is accessible to screen readers but not shown visually
- Use `aria-live="polite"` with `aria-atomic="true"` on the status text so screen readers announce changes
- `<caption>` is preferred over `aria-label` for tables because it benefits all users, not just screen reader users
- Since the `<thead>` is stable (only `<tbody>` gets re-rendered), you no longer need to re-attach sort event listeners on every render
