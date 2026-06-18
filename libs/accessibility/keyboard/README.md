# Accessibility Keyboard

## Purpose

Analyzes keyboard accessibility of a document. Identifies focusable elements, calculates tab order, and finds interactive elements that are not keyboard accessible.

## Public API

| Export             | Type    | Description                              |
| ------------------ | ------- | ---------------------------------------- |
| `KeyboardAnalysis` | Service | Performs keyboard accessibility analysis |

### KeyboardAnalysis

- `analyze(document: Document): KeyboardAnalysisResult`

The result contains:

- `focusableElements` — List of all focusable elements with selector, role, tabIndex, and isInteractive flag
- `tabOrder` — Calculated tab order (positive tabIndex first, then DOM order)
- `nonFocusableInteractive` — Interactive elements (via ARIA role) that cannot receive focus

## Dependencies

- `@practica11y/types` — FocusableElement, KeyboardAnalysisResult

## Usage Example

```typescript
import { inject } from '@angular/core';
import { KeyboardAnalysis } from '@practica11y/keyboard';

const keyboard = inject(KeyboardAnalysis);
const result = keyboard.analyze(document);

// result.tabOrder → ['#search', 'button:nth-child(1)', ...]
// result.nonFocusableInteractive → ['div:nth-child(3)'] // div with role="button" without tabindex
```
