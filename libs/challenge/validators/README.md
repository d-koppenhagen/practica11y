# Challenge Validators

## Purpose

Registry-based validator service that manages generic accessibility validators and runs them against a document. Each validator checks a specific accessibility criterion and returns a `ValidationResult`.

## Public API

| Export                 | Type      | Description                                   |
| ---------------------- | --------- | --------------------------------------------- |
| `ChallengeValidator`   | Service   | Registry + execution of all validators        |
| `axeNoViolations`      | Validator | No axe-core violations present                |
| `hasLandmarks`         | Validator | Landmark regions (main, nav, etc.) present    |
| `headingStructure`     | Validator | Correct heading hierarchy (no skipped levels) |
| `formLabels`           | Validator | All form fields are labeled                   |
| `colorContrast`        | Validator | WCAG-compliant color contrasts                |
| `semanticButton`       | Validator | Buttons use semantic elements                 |
| `keyboardAccessible`   | Validator | Interactive elements are keyboard accessible  |
| `imageAltText`         | Validator | All images have alt text                      |
| `focusTrapImplemented` | Validator | Focus trap is correctly implemented           |

### ChallengeValidator API

- `registerValidator(validator)` — Register validator in registry
- `validateChallenge(document, validatorIds, analysisResult)` — Execute validators

## Dependencies

- `@practica11y/models` — Validator, ValidationResult interfaces
- `@practica11y/types` — AccessibilityAnalysisResult
- `@practica11y/axe` — AxeAnalyzer (indirectly via context)
- `@practica11y/keyboard` — KeyboardAnalysis (indirectly via context)
- `@practica11y/focus` — FocusAnalysis (indirectly via context)

## Usage Example

```typescript
import { inject } from '@angular/core';
import {
  ChallengeValidator,
  imageAltText,
  hasLandmarks,
} from '@practica11y/validators';

const validator = inject(ChallengeValidator);

// Register validators
validator.registerValidator(imageAltText);
validator.registerValidator(hasLandmarks);

// Validate challenge
const results = await validator.validateChallenge(
  document,
  ['image-alt-text', 'has-landmarks'],
  analysisResult,
);
```
