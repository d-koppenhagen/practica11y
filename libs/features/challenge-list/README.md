# Challenge List

## Purpose

Feature component for displaying all available challenges with filter functionality by difficulty and tags. Shows the title, difficulty, tags, and completion status for each challenge.

## Public API

### `ChallengeList` Component

**Selector:** `a11y-challenge-list`

| Member                  | Type                 | Description                     |
| ----------------------- | -------------------- | ------------------------------- |
| `challenges`            | `input<Challenge[]>` | All available challenges        |
| `completedChallengeIds` | `input<string[]>`    | IDs of completed challenges     |
| `challengeSelected`     | `output<string>`     | Emits challenge ID on selection |

### Internal Filters

- Difficulty: `all`, `beginner`, `intermediate`, `advanced`
- Tags: dynamically generated from available challenges

## Dependencies

- `@practica11y/models` — Challenge interface

## Usage Example

```typescript
import { ChallengeList } from '@practica11y/challenge-list';

@Component({
  imports: [ChallengeList],
  template: `
    <a11y-challenge-list
      [challenges]="challenges()"
      [completedChallengeIds]="completed()"
      (challengeSelected)="navigateToChallenge($event)"
    />
  `,
})
export class ChallengesPage {}
```
