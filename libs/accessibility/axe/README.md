# Accessibility Axe

## Purpose

Integrates axe-core for automated accessibility audits and bundles all accessibility analyses in a central `AccessibilityEngine`. The `AxeAnalyzer` runs axe-core against a Document and maps the results to typed `AxeViolation` objects.

## Public API

| Export                | Type    | Description                                            |
| --------------------- | ------- | ------------------------------------------------------ |
| `AxeAnalyzer`         | Service | Runs `axe.run()`, maps violations                      |
| `AccessibilityEngine` | Service | Orchestrates all analyses (axe, tree, keyboard, focus) |

### AxeAnalyzer

- `run(document: Document): Promise<AxeViolation[]>` — Runs axe-core analysis

### AccessibilityEngine

- `analyze(document: Document): Promise<AccessibilityAnalysisResult>` — Runs all analyses in parallel and returns the combined result

## Dependencies

- `axe-core` — Accessibility testing engine
- `@practica11y/types` — AxeViolation, AccessibilityAnalysisResult
- `@practica11y/tree` — TreeGenerator
- `@practica11y/keyboard` — KeyboardAnalysis
- `@practica11y/focus` — FocusAnalysis

## Usage Example

```typescript
import { inject } from '@angular/core';
import { AccessibilityEngine } from '@practica11y/axe';

const engine = inject(AccessibilityEngine);

// Full analysis
const result = await engine.analyze(iframeDocument);
// result.axeResults → AxeViolation[]
// result.treeNodes → AccessibilityNode
// result.keyboardResults → KeyboardAnalysisResult
// result.focusResults → FocusAnalysisResult
```
