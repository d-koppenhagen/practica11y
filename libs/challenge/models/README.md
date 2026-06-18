# Challenge Models

## Purpose

Defines the core TypeScript interfaces for the challenge system. This library contains no logic — only type definitions consumed by `challenge/loader` and `challenge/validators`.

## Public API

| Export             | Type      | Description                                                                                      |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------ |
| `Challenge`        | Interface | Fully loaded challenge (id, title, difficulty, tags, points, description, starter, validatorIds) |
| `ChallengeMeta`    | Interface | Frontmatter metadata of a challenge markdown file                                                |
| `StarterCode`      | Interface | Starter code of a challenge (`html`, `css`)                                                      |
| `Validator`        | Interface | Validator contract with `id` and `validate(document, context?)`                                  |
| `ValidationResult` | Interface | Result of a validation (`validatorId`, `passed`, `message`, `details?`)                          |

## Dependencies

None — pure type library without runtime dependencies.

## Usage Example

```typescript
import type { Challenge, ValidationResult } from '@practica11y/models';

const challenge: Challenge = {
  id: 'alt-text',
  title: 'Add Image Descriptions',
  difficulty: 'beginner',
  tags: ['images', 'alt-text'],
  points: 100,
  description: '<p>Add alt text to all images.</p>',
  starter: { html: '<img src="cat.jpg">', css: '' },
  validatorIds: ['image-alt-text'],
};
```
