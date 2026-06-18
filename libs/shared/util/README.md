# Shared Util

## Purpose

Contains application-wide services for gamification, persistence, error handling, and theme management. All services use `providedIn: 'root'` and are globally available.

## Public API

| Export          | Type      | Description                                                 |
| --------------- | --------- | ----------------------------------------------------------- |
| `Gamification`  | Service   | XP management, level calculation, achievement system        |
| `ProgressStore` | Service   | Persistence (IndexedDB → localStorage → in-memory fallback) |
| `ErrorService`  | Service   | Central error handling via signal                           |
| `ThemeService`  | Service   | Dark/light theme management                                 |
| `AppError`      | Interface | Error data structure                                        |
| `Theme`         | Type      | `'light' \| 'dark'`                                         |

### Gamification

- `currentXP` — `Signal<number>`
- `currentLevel` — `Computed<Level>`
- `achievements` — `Signal<Achievement[]>`
- `levelUpEvent` — `Signal<Level | null>`
- `addXP(points)` — Add XP, check for level-up
- `calculateLevel(xp)` — Calculate level for given XP
- `checkAchievements(event)` — Check achievement conditions

### ProgressStore

- `initialize()` — Initialize storage (IndexedDB / localStorage / fallback)
- `saveProgress(progress)` / `loadProgress()` — Save/load UserProgress
- `markChallengeCompleted(challengeId)` — Mark challenge as completed
- `saveSettings(settings)` / `loadSettings()` — Save/load UserSettings
- `isStorageAvailable()` — Check storage availability

### ErrorService

- `errors` — `Signal<AppError[]>`
- `addError(error)` — Add error
- `clearError(id)` — Remove error

### ThemeService

- `theme` — `Signal<Theme>`
- `applySettings(settings)` — Set theme from UserSettings
- `toggle()` — Toggle between light/dark

## Dependencies

- `@practica11y/types` — Level, Achievement, UserProgress, UserSettings, GamificationEvent

## Usage Example

```typescript
import { inject } from '@angular/core';
import { Gamification, ProgressStore } from '@practica11y/util';

const gamification = inject(Gamification);
const store = inject(ProgressStore);

// Initialization
await store.initialize();

// Award XP
gamification.addXP(100);
console.log(gamification.currentLevel()); // 'hatchling'

// Save progress
await store.markChallengeCompleted('alt-text');
```
