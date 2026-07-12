---
id: playground
title: 'Playground'
difficulty: beginner
tags:
  - sandbox
points: 0
createdAt: '2026-06-21'
starter:
  html: starter.html
  css: starter.css
  js: starter.js
validators:
  - color-contrast
  - axe-no-violations
previewTitle: 'Playground | Practica11y'
links:
  - text: 'MDN: Web Accessibility'
    url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility'
  - text: 'WCAG 2.2 Quick Reference'
    url: 'https://www.w3.org/WAI/WCAG22/quickref/'
  - text: 'WAI-ARIA Authoring Practices'
    url: 'https://www.w3.org/WAI/ARIA/apg/'
---

Welcome to the **Playground** — your free-form sandbox for experimenting with HTML, CSS, and JavaScript.

There are no tasks or scores here. Just write code, explore, and learn how assistive technologies perceive your markup.

## How to Use

### Editor

Write your HTML, CSS, and JavaScript in the tabbed code editor. Changes are reflected instantly in the live preview.

### Preview

The live preview renders your code in a sandboxed iframe — exactly as a browser would display it. Use it to visually verify your layout and interactions.

### Accessibility Tree

Switch to the **Accessibility Tree** tab to see how the browser exposes your markup to assistive technologies. This is the structure screen readers, braille displays, and other tools navigate. Check whether your elements have proper roles, names, and states.

### Virtual Screen Reader

Switch to the **Virtual Screen Reader** tab to hear (or read) how a screen reader would announce your content. Walk through the page element by element and verify that the reading order and announcements make sense.

### Feedback

Click **Check Solution** to run an automated accessibility audit (powered by axe-core). It reports WCAG violations found in your code.

### Color Contrast Checker

Switch to the **Color Contrast** tab to inspect foreground and background color contrast of any element. Click **Pick element**, then select an element in the preview to see the contrast ratio and WCAG AA/AAA conformance levels at a glance.

> **Important:** Passing an automated check does not guarantee real accessibility. Automated tools catch roughly 30–50% of barriers. True accessibility requires manual testing with keyboard navigation, screen readers, and real users with disabilities.

## Ideas to Try

- Build a navigation menu and check its landmark structure
- Create a form and verify label associations
- Experiment with ARIA attributes and see how they change the accessibility tree
- Test keyboard interactions and focus management
