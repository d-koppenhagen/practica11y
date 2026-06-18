# Monaco Editor

## Purpose

Angular standalone component that wraps the Monaco Editor. Supports HTML and CSS languages with signal-based state and automatic cleanup on destroy.

## Public API

### `Monaco` Component

| Member           | Type                     | Description                                   |
| ---------------- | ------------------------ | --------------------------------------------- |
| `language`       | `input<'html' \| 'css'>` | Editor language (default: `'html'`)           |
| `initialContent` | `input<string>`          | Initial editor content                        |
| `content`        | `output<string>`         | Emits the current content on every change     |
| `currentContent` | `Signal<string>`         | Readonly signal of the current editor content |

**Selector:** `a11y-monaco-editor`

## Dependencies

- `monaco-editor` — Editor engine (dynamically imported)
- `@practica11y/ui` — Shared UI

## Usage Example

```html
<a11y-monaco-editor
  [language]="'html'"
  [initialContent]="starterHtml"
  (content)="onContentChange($event)"
/>
```

```typescript
import { Monaco } from '@practica11y/monaco';

@Component({
  imports: [Monaco],
  template: `
    <a11y-monaco-editor
      [language]="'css'"
      [initialContent]="css()"
      (content)="cssChanged($event)"
    />
  `,
})
export class MyEditor {}
```
