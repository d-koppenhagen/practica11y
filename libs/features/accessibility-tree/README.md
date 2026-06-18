# Accessibility Tree View

## Purpose

Feature component for visual representation of the accessibility tree as an interactive tree structure. Supports full keyboard navigation according to the WAI-ARIA Tree Pattern (Arrow keys, Home, End, Enter/Space to expand/collapse).

## Public API

| Export                  | Type      | Description                           |
| ----------------------- | --------- | ------------------------------------- |
| `AccessibilityTree`     | Component | Tree display with keyboard navigation |
| `AccessibilityTreeNode` | Component | Single tree node (recursive)          |

### AccessibilityTree

**Selector:** `a11y-accessibility-tree`

| Member | Type                               | Description           |
| ------ | ---------------------------------- | --------------------- |
| `tree` | `input<AccessibilityNode \| null>` | Root node of the tree |

### AccessibilityTreeNode

**Selector:** `a11y-accessibility-tree-node`

| Member          | Type                                | Description        |
| --------------- | ----------------------------------- | ------------------ |
| `node`          | `input.required<AccessibilityNode>` | Node to display    |
| `depth`         | `input<number>`                     | Nesting depth      |
| `parentSize`    | `input<number>`                     | Number of siblings |
| `positionInSet` | `input<number>`                     | Position in set    |
| `nodeAction`    | `output<TreeNodeFocusEvent>`        | Navigation events  |

## Dependencies

- `@practica11y/types` — AccessibilityNode interface

## Usage Example

```typescript
import { AccessibilityTree } from '@practica11y/accessibility-tree';

@Component({
  imports: [AccessibilityTree],
  template: `<a11y-accessibility-tree [tree]="treeData()" />`,
})
export class MyView {}
```
