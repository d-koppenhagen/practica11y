# Accessibility Focus

## Purpose

Analyzes focus management in a document. Detects focus traps (modals/dialogs), identifies hidden but focusable elements, and determines the actual focus order considering visibility.

## Public API

| Export          | Type    | Description             |
| --------------- | ------- | ----------------------- |
| `FocusAnalysis` | Service | Performs focus analysis |

### FocusAnalysis

- `analyze(document: Document): FocusAnalysisResult`

The result contains:

- `focusTraps` — Containers with `aria-modal="true"` or `role="dialog"` (potential focus traps)
- `hiddenFocusable` — Focusable elements that are visually hidden (`hidden`, `aria-hidden`, `display:none`, `visibility:hidden`)
- `focusOrder` — Actual focus order (visible elements only, sorted by tabIndex)

## Dependencies

- `@practica11y/types` — FocusAnalysisResult

## Usage Example

```typescript
import { inject } from '@angular/core';
import { FocusAnalysis } from '@practica11y/focus';

const focus = inject(FocusAnalysis);
const result = focus.analyze(document);

// result.focusTraps → ['#modal-dialog']
// result.hiddenFocusable → ['button:nth-child(2)'] // hidden button with tabindex
// result.focusOrder → ['#search', '#submit', '#cancel']
```
