# Shared UI

## Purpose

Provides shared UI components for the entire application. Contains reusable, generic presentation components without business logic.

## Public API

| Export        | Type      | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| `ThemeToggle` | Component | Toggle button for switching between light and dark theme |

**Selector:** `lib-theme-toggle`

## Dependencies

- `@practica11y/util` — `ThemeService` for theme state management

## Usage Example

```typescript
import { ThemeToggle } from '@practica11y/ui';

@Component({
  imports: [ThemeToggle],
  template: `<lib-theme-toggle />`,
})
export class MyComponent {}
```
