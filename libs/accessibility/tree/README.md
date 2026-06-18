# Accessibility Tree

## Purpose

Generates a typed accessibility tree from a DOM element. Uses `dom-accessibility-api` to determine roles and accessible names. Nodes with the role `none` or `presentation` are filtered out.

## Public API

| Export          | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| `TreeGenerator` | Service | Recursively generates an `AccessibilityNode` tree |

### TreeGenerator

- `generate(rootElement: Element): AccessibilityNode` — Builds the tree recursively

Each node contains:

- `role` — ARIA role (via `getRole()`)
- `name` — Accessible name (via `computeAccessibleName()`)
- `level` — Heading level (1–6), only for headings
- `children` — Child nodes (filtered: no `none`/`presentation`)

## Dependencies

- `dom-accessibility-api` — `getRole()`, `computeAccessibleName()`
- `@practica11y/types` — AccessibilityNode interface

## Usage Example

```typescript
import { inject } from '@angular/core';
import { TreeGenerator } from '@practica11y/tree';

const generator = inject(TreeGenerator);
const tree = generator.generate(document.documentElement);

// tree.role → 'document'
// tree.children[0].role → 'navigation'
// tree.children[0].name → 'Main navigation'
```
