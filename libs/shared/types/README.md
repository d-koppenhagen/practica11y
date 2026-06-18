# Shared Types

## Purpose

Central TypeScript interfaces and types consumed by multiple libraries. Defines data models for accessibility analysis, gamification, persistence, and validation. Contains no logic — only type definitions.

## Public API

### Accessibility (`accessibility.model.ts`)

| Export                        | Type      | Description                                                    |
| ----------------------------- | --------- | -------------------------------------------------------------- |
| `AccessibilityNode`           | Interface | Node in the accessibility tree (role, name?, level?, children) |
| `AxeViolation`                | Interface | axe-core violation (id, impact, description, helpUrl, nodes)   |
| `AxeViolationNode`            | Interface | Affected DOM node of a violation                               |
| `KeyboardAnalysisResult`      | Interface | Result of keyboard analysis                                    |
| `FocusableElement`            | Interface | Single focusable element                                       |
| `FocusAnalysisResult`         | Interface | Result of focus analysis                                       |
| `AccessibilityAnalysisResult` | Interface | Combined result of all analyses                                |

### Gamification (`gamification.model.ts`)

| Export              | Type      | Description                                        |
| ------------------- | --------- | -------------------------------------------------- |
| `Level`             | Type      | `'hatchling' \| 'scout' \| 'guardian' \| 'legend'` |
| `LevelThreshold`    | Interface | Level threshold definition                         |
| `LEVEL_THRESHOLDS`  | Constant  | Array with level thresholds                        |
| `Achievement`       | Interface | Unlocked achievement                               |
| `GamificationEvent` | Interface | Event for achievement checking                     |

### Persistence (`persistence.model.ts`)

| Export         | Type      | Description                                                           |
| -------------- | --------- | --------------------------------------------------------------------- |
| `UserProgress` | Interface | Progress (xp, completedChallenges, achievements, level, lastActivity) |
| `UserSettings` | Interface | Settings (editorTheme, fontSize, reducedMotion)                       |

### Validation (`validation.model.ts`)

| Export             | Type      | Description                                                     |
| ------------------ | --------- | --------------------------------------------------------------- |
| `ValidationResult` | Interface | Result of a validation (validatorId, passed, message, details?) |

### Analysis Pipeline (`analysis-pipeline.model.ts`)

| Export                   | Type      | Description                                                                                       |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `AnalysisPipelineResult` | Interface | Overall pipeline result (validationResults, accessibilityAnalysis, challengeCompleted, timestamp) |

## Dependencies

None — pure type library.

## Usage Example

```typescript
import {
  AccessibilityNode,
  AxeViolation,
  UserProgress,
  Level,
  LEVEL_THRESHOLDS,
} from '@practica11y/types';

const progress: UserProgress = {
  xp: 750,
  completedChallenges: ['alt-text', 'heading-structure'],
  achievements: [],
  currentLevel: 'scout',
  lastActivity: new Date(),
};
```
