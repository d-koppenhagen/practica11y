# Contributing to Practica11y

Thank you for your interest in Practica11y! This document describes how you can contribute to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Branch Strategy](#branch-strategy)
- [Commit Conventions](#commit-conventions)
- [Code Style](#code-style)
- [Adding Dependencies](#adding-dependencies)
- [Creating a New Library](#creating-a-new-library)
- [Creating a New Challenge](#creating-a-new-challenge)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 24
- **pnpm** ≥ 11
- An editor with TypeScript support

### Installation

```bash
git clone <repository-url>
cd practica11y
pnpm install
```

### Important Commands

| Command                          | Description               |
| -------------------------------- | ------------------------- |
| `pnpm start`                     | Start dev server          |
| `pnpm nx test <project>`         | Run tests for a project   |
| `pnpm nx lint <project>`         | Run linting for a project |
| `pnpm nx run-many --target=test` | Run all tests             |
| `pnpm nx build practica11y`      | Production build          |
| `pnpm format`                    | Format entire repo        |

### Monorepo Structure

The project uses **Nx** as a monorepo tool. All commands are run via `pnpm nx`. The project structure:

```
apps/
  practica11y/          → Angular app (Standalone, Signals, OnPush)
libs/
  challenge/
    models/             → Data models
    loader/             → Challenge loader
    validators/         → Validation logic
  preview/
    sandbox/            → Preview sandbox
  accessibility/
    axe/                → axe-core integration
    tree/               → Accessibility tree
    keyboard/           → Keyboard navigation
    focus/              → Focus management
  features/
    challenge-shell/    → Challenge view
    challenge-list/     → Challenge overview
    challenge-feedback/ → Feedback display
    accessibility-tree/ → Accessibility tree feature
  shared/
    ui/                 → Reusable UI components
    util/               → Utility functions
    types/              → Shared TypeScript types
```

---

## Workflow

1. Select an issue or feature in the tracker
2. Create a feature branch (see [Branch Strategy](#branch-strategy))
3. Implement changes
4. Write tests and ensure all tests pass
5. Format and lint the code
6. Create commit(s) (see [Commit Conventions](#commit-conventions))
7. Create a merge request (see [Pull Request Process](#pull-request-process))

---

## Branch Strategy

| Branch                    | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `main`                    | Production-ready state, always deployable |
| `feat/<feature-name>`     | New features                              |
| `fix/<issue-description>` | Bug fixes                                 |

### Rules

- **Never** work directly on `main`
- Branch names in kebab-case: `feat/challenge-progress-tracking`
- Keep branches short-lived — prefer small, focused changes

---

## Commit Conventions

We use **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| `feat`     | New feature                                   |
| `fix`      | Bug fix                                       |
| `docs`     | Documentation only                            |
| `style`    | Formatting, semicolons, etc. (no code change) |
| `refactor` | Code change without new feature or bug fix    |
| `test`     | Adding or fixing tests                        |
| `chore`    | Build process, dependencies, tooling          |

### Scopes

| Scope           | Area                  |
| --------------- | --------------------- |
| `app`           | Angular app           |
| `models`        | Challenge data models |
| `loader`        | Challenge loader      |
| `validators`    | Validation logic      |
| `editor`        | Monaco editor         |
| `preview`       | Sandbox preview       |
| `accessibility` | Accessibility engine  |
| `features`      | Feature libraries     |
| `shared`        | Shared libraries      |
| `docs`          | Documentation         |

### Examples

```
feat(loader): implement markdown parsing for challenge files
fix(validators): fix aria-label validation for empty strings
docs(app): update README with setup instructions
test(accessibility): add unit tests for axe-core integration
```

---

## Code Style

### Angular Style Guide (modern, no suffixes)

We follow the modern [Angular Style Guide](https://angular.dev/style-guide) with the important convention: **no type suffixes** in class and file names.

#### Class Names

| ❌ Legacy                | ✅ Modern         |
| ------------------------ | ----------------- |
| `UserProfileComponent`   | `UserProfile`     |
| `ChallengeLoaderService` | `ChallengeLoader` |
| `HighlightDirective`     | `Highlight`       |

#### File Names

Kebab-case, without type suffix:

| Class             | File                  |
| ----------------- | --------------------- |
| `UserProfile`     | `user-profile.ts`     |
| `ChallengeLoader` | `challenge-loader.ts` |
| `ChallengeList`   | `challenge-list.ts`   |

Templates and styles: `user-profile.html`, `user-profile.css`
Tests: `user-profile.spec.ts`

#### Angular Conventions

- **Use `inject()`** instead of constructor parameter injection
- **Standalone Components** — no `NgModule`
- **Signals** for reactive state
- **OnPush** change detection
- **`readonly`** for Angular-initialized properties (`input`, `output`, `model`)
- **`protected`** for members only used in the template
- **Lifecycle interfaces** implemented (`implements OnInit`)
- **Feature-based folder structure** — no type folders like `components/`, `services/`
- **One concept per file** — one component/directive/service per file

### ESLint

The project uses ESLint with `angular-eslint` and `typescript-eslint` in flat config (`eslint.config.mjs`). Check lint before every commit:

```bash
pnpm nx lint <project-name>
```

### Prettier

Formatting is ensured via Prettier. Configuration in `.prettierrc`:

```json
{
  "singleQuote": true
}
```

Format entire repo:

```bash
pnpm format
```

### TypeScript

- TypeScript in strict mode
- Prefer explicit types, avoid `any`
- Interfaces for data structures, type aliases for unions/utilities

---

## Adding Dependencies

This project uses [pnpm catalogs](https://pnpm.io/catalogs) defined in `pnpm-workspace.yaml` for centralized version management. The catalog mode is set to `strict`, meaning **all** dependencies must be declared in the catalog.

### How to Add a New Dependency

1. **Add the version to the catalog** in `pnpm-workspace.yaml`:

   ```yaml
   catalog:
     my-new-package: 1.2.3
   ```

2. **Add the dependency to `package.json`** using `catalog:` as the version specifier:

   ```json
   {
     "dependencies": {
       "my-new-package": "catalog:"
     }
   }
   ```

3. **Run `pnpm install`** to update the lockfile.

### Rules

- Never use raw version strings in `package.json` — always use `"catalog:"`
- Pin exact versions in the catalog (no `^` or `~` ranges)
- Prefer well-maintained, widely-adopted packages

---

## Creating a New Library

Step by step to create a new Nx library:

1. **Generate the library:**

   ```bash
   pnpm nx g @nx/angular:library --name=<name> --directory=libs/<path>
   ```

   Example:

   ```bash
   pnpm nx g @nx/angular:library --name=progress --directory=libs/features/progress
   ```

2. **Define the public API** in `src/index.ts` — only export what other libraries/apps need.

3. **Write tests** (see [Testing Guidelines](#testing-guidelines)).

4. **Run lint and tests:**

   ```bash
   pnpm nx lint <library-name>
   pnpm nx test <library-name>
   ```

5. **Import in the app or other libraries** using the path alias (defined in `tsconfig.base.json`).

---

## Creating a New Challenge

> **Tip for AI assistants:** The SKILL at `.agents/skills/create-challenge/SKILL.md` contains a detailed step-by-step guide with all file formats, interfaces, and examples.

Step by step to create a new accessibility challenge:

1. **Create the directory:**

   ```bash
   mkdir -p apps/practica11y/public/content/challenges/<challenge-id>/
   ```

2. **Create `challenge.md`** with YAML frontmatter:

   ```markdown
   ---
   id: '<challenge-id>'
   title: 'Challenge Title'
   difficulty: beginner # beginner | intermediate | advanced
   tags:
     - semantics
     - aria
   points: 100
   starter:
     html: starter.html # required
     css: starter.css # optional
     js: starter.js # optional
   validators:
     - image-alt-text # one or more validator IDs
   links:
     - text: 'MDN: Relevant Topic'
       url: 'https://developer.mozilla.org/...'
   ---

   Describe the accessibility problem here...

   ## Your Task

   Explain what the user needs to fix.

   ## Tips

   - Helpful hints for the solution
   ```

3. **Create starter files:**
   - `starter.html` (required) — HTML with the accessibility issue to fix
   - `starter.css` (optional) — styling for the preview
   - `starter.js` (optional) — JavaScript if the challenge involves interactivity

4. **Add entry to `registry.json`:**

   Add `{ "id": "<challenge-id>" }` to `apps/practica11y/public/content/challenges/registry.json`.

5. **Add the challenge to the issue templates:**

   Append the challenge to the `challenge` dropdown in `.github/ISSUE_TEMPLATE/bug_report.yml`, right before the `Other / not listed here` option. Use the exact `Title (id)` format so the in-app success dialog can pre-select it via the issue URL:

   ```yaml
   - Descriptive Title (<challenge-id>)
   ```

6. **Validator** — either use an existing one or create a new one:
   - Create the validator in `libs/challenge/validators/src/lib/<validator-id>.ts`
   - Export from `libs/challenge/validators/src/index.ts`
   - Register in `libs/features/challenge-shell/src/lib/analysis-pipeline.ts`

   See `.agents/skills/create-challenge/SKILL.md` for the `Validator` interface, available validators, and full examples.

7. **Test locally:**

   ```bash
   pnpm start
   ```

   Open `/challenges/<challenge-id>` and verify:
   - Challenge loads (title, description, links)
   - Starter code appears in editor
   - Validator fails on unmodified code
   - Validator passes after correct fix

---

## Testing Guidelines

### Frameworks

| Tool                         | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| **Vitest**                   | Test runner and assertions                |
| **@testing-library/angular** | Component tests (DOM-based, user-centric) |

### Principles

- **Tests are mandatory** — every new feature needs tests
- **Test from the user's perspective** — use `@testing-library/angular` to test what the user sees/does, not the internal implementation
- **Avoid mocks when possible** — prefer real dependencies, only mock external services
- **Descriptive test names** — `it('shows error message for invalid aria-label')` instead of `it('test 1')`

### Test Files

- Co-location: tests next to the source file as `<name>.spec.ts`
- Example: `challenge-loader.ts` → `challenge-loader.spec.ts`

### Example

```typescript
import { render, screen } from '@testing-library/angular';
import { ChallengeList } from './challenge-list';

describe('ChallengeList', () => {
  it('displays all challenges with their title', async () => {
    await render(ChallengeList, {
      inputs: {
        challenges: [
          { id: '1', title: 'Alt-Text', difficulty: 'beginner' },
          { id: '2', title: 'ARIA Labels', difficulty: 'intermediate' },
        ],
      },
    });

    expect(screen.getByText('Alt-Text')).toBeInTheDocument();
    expect(screen.getByText('ARIA Labels')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Single project
pnpm nx test challenge-loader

# All tests
pnpm nx run-many --target=test

# With coverage
pnpm nx test challenge-loader --coverage
```

---

## Pull Request Process

### Before the MR

1. ✅ All tests pass: `pnpm nx run-many --target=test`
2. ✅ Lint without errors: `pnpm nx run-many --target=lint`
3. ✅ Code is formatted: `pnpm format`
4. ✅ Commit messages follow the [conventions](#commit-conventions)
5. ✅ Branch is rebased on current `main`

### Create Merge Request

```bash
glab mr create --fill
```

### MR Description

Every MR should include:

- **What**: Brief summary of the change
- **Why**: Context or linked issues
- **How tested**: Description of tests or manual steps
- **Screenshots** (for UI changes)

### Review Criteria

- Code follows the [Code Style](#code-style)
- Tests are present and passing
- No unintended breaking changes
- Accessibility aspects are considered (we're building an a11y tool after all!)
- No dead code or commented-out blocks

### After the Merge

- Delete the branch (auto-deleted if configured in GitLab)
- Close related issues if applicable

---

## Further Reading

Detailed architecture and design documentation is available in the `docs/` folder:

| Document                   | Content                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `docs/architecture.md`     | System overview, library architecture, dependency rules          |
| `docs/data-flow.md`        | Analysis pipeline flow, gamification flow, sandbox communication |
| `docs/testing-strategy.md` | Test pyramid, conventions, coverage targets                      |
