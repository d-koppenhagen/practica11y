# Sandbox Preview

## Purpose

Renders user code in an isolated `<iframe>` using the `srcdoc` pattern. Emits a `domReady` event via `postMessage` as soon as the DOM in the iframe is fully rendered — so the accessibility engine knows when to start analysis.

## Public API

### `SandboxPreview` Component

| Member        | Type                     | Description                                     |
| ------------- | ------------------------ | ----------------------------------------------- |
| `htmlContent` | `input.required<string>` | HTML content for the iframe                     |
| `cssContent`  | `input<string>`          | CSS content (default: `''`)                     |
| `domReady`    | `output<MessageEvent>`   | Emits when iframe sends `dom-ready` postMessage |
| `srcdoc`      | `computed<string>`       | Internal computed signal for the iframe srcdoc  |

**Selector:** `a11y-sandbox-preview`

### Communication Protocol

```
SandboxPreview → iframe: srcdoc update
iframe → SandboxPreview: postMessage({ type: 'dom-ready' })
```

## Dependencies

- `@practica11y/types` — Shared interfaces

## Usage Example

```html
<a11y-sandbox-preview
  [htmlContent]="html()"
  [cssContent]="css()"
  (domReady)="onDomReady()"
/>
```

```typescript
import { SandboxPreview } from '@practica11y/sandbox';

@Component({
  imports: [SandboxPreview],
  template: `
    <a11y-sandbox-preview
      [htmlContent]="htmlContent()"
      (domReady)="startAnalysis()"
    />
  `,
})
export class MyPreview {}
```
