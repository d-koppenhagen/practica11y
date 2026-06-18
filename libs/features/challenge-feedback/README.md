# Challenge Feedback

## Purpose

Feature component for displaying the validation results of a challenge. Shows the status of each validator (passed/failed), groups axe-core violations by impact severity, and signals the completion of a challenge.

## Public API

### `ChallengeFeedback` Component

**Selector:** `a11y-challenge-feedback`

| Member   | Type                                    | Description             |
| -------- | --------------------------------------- | ----------------------- |
| `result` | `input<AnalysisPipelineResult \| null>` | Current analysis result |

### Internal Behavior

- `validationResults` — Computed: validator results from the result
- `challengeCompleted` — Computed: whether all validators passed
- `violationGroups` — Computed: violations grouped by impact (critical → minor)

## Dependencies

- `@practica11y/types` — AnalysisPipelineResult, AxeViolation

## Usage Example

```typescript
import { ChallengeFeedback } from '@practica11y/challenge-feedback';

@Component({
  imports: [ChallengeFeedback],
  template: `<a11y-challenge-feedback [result]="analysisResult()" />`,
})
export class MyShell {}
```
