# Challenge Shell

## Purpose

Feature component for the challenge workspace. Orchestrates editor, live preview, accessibility tree, and feedback panel. Contains the `AnalysisPipeline` that coordinates the data flow from code change to validation result (with 300ms debounce).

## Public API

| Export             | Type      | Description                             |
| ------------------ | --------- | --------------------------------------- |
| `ChallengeShell`   | Component | Complete challenge workspace            |
| `AnalysisPipeline` | Service   | Coordinates analysis flow with debounce |

### ChallengeShell

**Selector:** `a11y-challenge-shell`

| Member      | Type                        | Description      |
| ----------- | --------------------------- | ---------------- |
| `challenge` | `input.required<Challenge>` | Active challenge |

### AnalysisPipeline

- `setChallenge(challenge)` — Sets the active challenge
- `setSandboxDocument(doc)` — Sets the sandbox document for analysis
- `updateCode(html, css)` — Code change (debounced)
- `runPipeline(doc)` — Runs the complete analysis
- `analysisResult` — `Signal<AnalysisPipelineResult | null>`
- `isAnalyzing` — `Signal<boolean>`
- `debouncedCodeChange` — Debounced code signal

## Dependencies

- `@practica11y/models` — Challenge interface
- `@practica11y/monaco` — Editor component
- `@practica11y/sandbox` — Preview component
- `@practica11y/accessibility-tree` — Tree visualization
- `@practica11y/challenge-feedback` — Feedback panel
- `@practica11y/axe` — AccessibilityEngine
- `@practica11y/validators` — ChallengeValidator
- `@practica11y/types` — AnalysisPipelineResult
- `@practica11y/util` — Gamification, ProgressStore

## Usage Example

```typescript
import { ChallengeShell } from '@practica11y/challenge-shell';

@Component({
  imports: [ChallengeShell],
  template: `<a11y-challenge-shell [challenge]="challenge()" />`,
})
export class ChallengeDetailPage {
  readonly challenge = signal<Challenge>(loadedChallenge);
}
```
