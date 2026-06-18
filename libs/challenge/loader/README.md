# Challenge Loader

## Purpose

Loads and parses markdown-based challenges from static files. The library provides a `ChallengeLoader` service that reactively provides a challenge registry via Angular's `httpResource` and loads individual challenges on-demand via `fetch()`.

The parsing pipeline extracts YAML frontmatter, validates it against the `ChallengeMeta` schema, and loads associated starter files (HTML, CSS).

## Public API

| Export                   | Type      | Description                                                          |
| ------------------------ | --------- | -------------------------------------------------------------------- |
| `ChallengeLoader`        | Service   | Loads registry and challenges, provides signals                      |
| `parseFrontmatter(raw)`  | Function  | Extracts and validates YAML frontmatter → `ChallengeMeta`            |
| `parseMarkdownBody(raw)` | Function  | Extracts the body after the closing `---`                            |
| `ChallengeRegistry`      | Interface | Registry JSON structure (`{ challenges: ChallengeRegistryEntry[] }`) |
| `ChallengeRegistryEntry` | Interface | Single registry entry (`{ id: string }`)                             |

### ChallengeLoader API

- `registryResource` — `HttpResourceRef<ChallengeRegistry>` (reactive)
- `registryEntries` — `Signal<ChallengeRegistryEntry[]>`
- `availableChallenges` — `Signal<Challenge[]>` (readonly)
- `loadAllChallenges()` — Loads all challenges from the registry
- `loadChallenge(id)` — Loads a single challenge including starter code

## Dependencies

- `@practica11y/models` — Challenge, ChallengeMeta, StarterCode interfaces
- `yaml` — YAML parsing

## Usage Example

```typescript
import { inject } from '@angular/core';
import { ChallengeLoader } from '@practica11y/loader';

const loader = inject(ChallengeLoader);

// Reactive: registry entries as signal
const entries = loader.registryEntries();

// Imperative: load a single challenge
const challenge = await loader.loadChallenge('alt-text');
```
