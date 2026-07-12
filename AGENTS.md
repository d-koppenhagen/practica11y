<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Practica11y Workspace

## Project Overview

Practica11y is a gamified, client-side learning platform for web accessibility. Built with Angular 21+, Nx monorepo, Tailwind CSS, and Vitest. No backend — all state lives in localStorage.

- **Domain**: `practica11y.dev`
- **Repository**: `https://github.com/d-koppenhagen/practica11y`
- **Node**: >=24
- **Package Manager**: `pnpm@11.1.1` (enforced — never use npm or yarn)

## Writing Features / Specs

Whenever creating a new spec: do not add tasks for property tests but only solid deterministic unit tests and probably consider writing integration tests.

## Dependencies

This workspace uses **pnpm catalogs** with `catalogMode: 'strict'` in `pnpm-workspace.yaml`. All dependency versions are centralized in the `catalog:` section.

Rules:

- **Always use `catalog:`** as the version specifier in any `package.json` — never inline a version string (e.g., `"^1.0.0"`).
- When adding a new dependency, first add it to the `catalog:` section in `pnpm-workspace.yaml` with the pinned version, then reference it as `"catalog:"` in the relevant `package.json`.
- When bumping a dependency version, update it in `pnpm-workspace.yaml` only — all packages that use `catalog:` will pick up the new version automatically.
- The root `package.json` uses `catalog:` for all `dependencies` and `devDependencies`. Sub-project `package.json` files (e.g., `apps/practica11y-e2e/package.json`) follow the same pattern.

## Commands

All commands run from workspace root. Never `cd` into subdirectories.

| Task         | Command                          |
| ------------ | -------------------------------- |
| Install      | `pnpm install`                   |
| Dev server   | `pnpm nx serve practica11y`      |
| Build        | `pnpm nx build practica11y`      |
| Test all     | `pnpm nx run-many --target=test` |
| Test single  | `pnpm nx test <project-name>`    |
| Lint all     | `pnpm nx run-many --target=lint` |
| Format       | `pnpm prettier --write .`        |
| Generate lib | `pnpm nx g @nx/angular:lib`      |

Rules:

- Always prefix `nx` with `pnpm` — never use a global `nx` CLI.
- Always append `--no-tui` to `nx` commands (or prefix with `NX_TUI=false`) to disable the interactive terminal UI.

## Architecture

### GitHub Sync (Cross-Device Progress)

Users can sign in with GitHub (OAuth Device Flow) to sync progress across devices. Key details:

- **AuthStore** (`libs/shared/util/src/lib/auth-store.ts`): Manages Device Flow lifecycle, token persistence in localStorage (`practica11y-auth` key), session restoration
- **SyncStore** (`libs/shared/util/src/lib/sync-store.ts`): Handles Gist CRUD, merge-based conflict resolution, sync orchestration
- **Gist filename**: `practica11y-sync.json` (private Gist, `gist` scope)
- **Sync strategy**: Merge (union of challenges/achievements, max XP) — NOT last-write-wins
- **CORS proxy**: Cloudflare Worker at `workers/github-auth-proxy/` (see `docs/github-auth-proxy.md`)
- **Client ID**: Public OAuth App ID, safe to commit (no secret needed for Device Flow)
- **UI**: `UserMenu` component (avatar dropdown) + `DeviceFlowDialog` (native `<dialog>`)

### Monorepo Layout

```text
apps/practica11y/          → Main Angular application
libs/
  accessibility/           → axe-core, tree analysis, keyboard/focus
    axe/ | focus/ | keyboard/ | tree/
  challenge/               → Challenge models, loading, validation
  preview/                 → Sandboxed iframe for live preview
  features/                → Route-level feature libraries
    accessibility-tree/ | challenge-feedback/ | challenge-list/ | challenge-shell/ | color-contrast-checker/ | virtual-screen-reader/
  shared/                  → Cross-cutting concerns
    types/ | ui/ | util/
```

### Angular Conventions

- Standalone only — no NgModules
- Zoneless change detection (no `zone.js`)
- Signals over RxJS for local/component state
- `inject()` over constructor injection
- No type suffixes in class names — `UserProfile` not `UserProfileComponent`
- Filenames: kebab-case without type suffix — `user-profile.ts`, `user-profile.html`, `user-profile.css`
- `readonly` for Angular-managed properties (`input`, `output`, `model`, queries)
- `protected` for template-only members
- Event handlers named by action (`saveChallenge()`) not event (`handleClick()`)
- One concept per file — one component/directive/service per file
- Lazy loading for all routes
- `OnPush` change detection strategy on all components

### Code Style

- Prettier with `singleQuote: true`
- ESLint via `angular-eslint` + `@nx/eslint`
- All code, comments, and content in English
- Feature-based folder structure, never type-based (`components/`, `services/`)

## Challenge System

Challenges live at `apps/practica11y/public/content/challenges/<slug>/`:

```text
challenge.md        → Description + frontmatter metadata
starter/            → Initial HTML/CSS/JS for the user
solution/           → Reference solution
validators/         → Custom TypeScript validation logic
```

When adding challenges:

- Update the challenge registry.
- Include clear learning objectives in the frontmatter.
- Always set `createdAt` to today's date (YYYY-MM-DD format).
- When making content changes to existing challenges, add or update `updatedAt` to today's date.
- Challenges with `createdAt` within 7 days show a "New" badge; those with `updatedAt` within 7 days show an "Updated" badge.

## Testing

- **Framework**: Vitest (configured via `@nx/vitest` plugin)
- **DOM**: jsdom environment
- **Coverage**: `@vitest/coverage-v8`
- **Angular utilities**: `@testing-library/angular` + `@testing-library/dom`
- **Accessibility assertions**: axe-core
- Run tests in single-run mode (no watch) when executing from agent context.

## Accessibility Requirements

This is an accessibility teaching platform — the UI itself must be exemplary:

- WCAG 2.2 AA compliance on all UI
- Full keyboard navigation without mouse dependency
- Semantic HTML with proper ARIA where needed
- Color contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
- Visible focus indicators and logical tab order
- Respect `prefers-reduced-motion`

## Documentation

Architecture and data flow documentation lives in `docs/`:

| File                       | Content                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `docs/architecture.md`     | System overview, Nx library graph, dependency rules             |
| `docs/data-flow.md`        | Analysis pipeline, gamification, sandbox communication, caching |
| `docs/testing-strategy.md` | Testing approach, tools, coverage expectations                  |

Rules:

- When making changes that affect architecture, data flow, or communication patterns, **update the relevant `docs/` file** in the same change.
- When adding new libraries, update the library graph in `docs/architecture.md`.
- When modifying the sandbox/preview pipeline or message protocol, update `docs/data-flow.md`.
- When introducing new design decisions or trade-offs, document the rationale (why, not just what).

## Deployment

- GitHub Pages via `deploy.yml` workflow
- Build output: `dist/apps/practica11y/browser/`
- Custom domain: `practica11y.dev` (CNAME in repo)
- Branch strategy: feature branches → PR → merge to main

## GitHub CLI (`gh`)

When interacting with GitHub (issues, PRs, workflows, releases), prefer the **GitHub CLI** (`gh`) over `web_fetch` or direct API calls.

### Prerequisites

Before using `gh`, verify authentication is active:

```bash
gh auth status
```

If not authenticated, prompt the user to run `gh auth login`.

### Rules

- **Prefer `gh` over `web_fetch`** — when a GitHub URL is pasted (issue, PR, workflow run, etc.), extract the relevant info using `gh` commands instead of fetching the HTML page.
- **Read issue/PR comments** — when investigating issues, always include comments for full context (`gh issue view <number> --comments`).
- **No raw API calls** — avoid `curl` against `api.github.com`; use `gh api` if the CLI doesn't have a dedicated subcommand.

### Typical Use Cases

| Task                     | Command                                             |
| ------------------------ | --------------------------------------------------- |
| View issue with comments | `gh issue view <number> --comments`                 |
| List issues              | `gh issue list`                                     |
| View PR with comments    | `gh pr view <number> --comments`                    |
| List PRs                 | `gh pr list`                                        |
| Check workflow runs      | `gh run list`                                       |
| View a specific run      | `gh run view <run-id>`                              |
| View run logs            | `gh run view <run-id> --log-failed`                 |
| Create a PR              | `gh pr create --fill`                               |
| View repo info           | `gh repo view`                                      |
| Query API (advanced)     | `gh api repos/{owner}/{repo}/actions/runs --jq ...` |

### Handling Pasted GitHub Links

When the user pastes a GitHub URL, parse the type and identifier:

- `https://github.com/<owner>/<repo>/issues/<number>` → `gh issue view <number> --comments`
- `https://github.com/<owner>/<repo>/pull/<number>` → `gh pr view <number> --comments`
- `https://github.com/<owner>/<repo>/actions/runs/<run-id>` → `gh run view <run-id>`

Always use `gh` as the primary tool. Fall back to `web_fetch` only if `gh` cannot provide the needed information (e.g., rendered markdown previews or non-GitHub pages).

# Angular Style Guide (angular.dev/style-guide)

## Naming — No Suffixes

In modern Angular (v20+), **no** type suffixes are used in class names:

- ❌ `UserProfileComponent` → ✅ `UserProfile`
- ❌ `ChallengeLoaderService` → ✅ `ChallengeLoader`
- ❌ `HighlightDirective` → ✅ `Highlight`
- ❌ `AuthGuard` → ✅ `Auth` (or a more descriptive name)

Filenames mirror the class name (kebab-case, without type suffix):

- `UserProfile` → `user-profile.ts`, `user-profile.html`, `user-profile.css`
- `ChallengeLoader` → `challenge-loader.ts`
- Tests: `user-profile.spec.ts`

## Additional Conventions

- **Prefer `inject()`** over constructor parameter injection
- **`readonly`** for Angular-initialized properties (`input`, `output`, `model`, queries)
- **`protected`** for members used only in the template
- **Implement lifecycle interfaces** (`implements OnInit`)
- **Feature-based folder structure** — no type folders like `components/`, `services/`
- **One concept per file** — one component/directive/service per file
- **Prefer `class`/`style` bindings** over `ngClass`/`ngStyle`
- **Name event handlers by action**, not by event (`saveUserData()` not `handleClick()`)

# Language

All content in this repository must be written in **English**. This includes:

- Code (variable names, function names, class names)
- Comments and documentation
- UI text and labels
- Commit messages and branch names
- Issue titles and descriptions
- README and other Markdown files
