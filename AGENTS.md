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

# Angular Style Guide (angular.dev/style-guide)

## Naming — Keine Suffixe

Im modernen Angular (v20+) werden **keine** Typ-Suffixe mehr in Klassennamen verwendet:

- ❌ `UserProfileComponent` → ✅ `UserProfile`
- ❌ `ChallengeLoaderService` → ✅ `ChallengeLoader`
- ❌ `HighlightDirective` → ✅ `Highlight`
- ❌ `AuthGuard` → ✅ `Auth` (oder aussagekräftiger Name)

Dateinamen spiegeln den Klassennamen wider (kebab-case, ohne Typ-Suffix):

- `UserProfile` → `user-profile.ts`, `user-profile.html`, `user-profile.css`
- `ChallengeLoader` → `challenge-loader.ts`
- Tests: `user-profile.spec.ts`

## Weitere Konventionen

- **`inject()` bevorzugen** statt Constructor-Parameter-Injection
- **`readonly`** für von Angular initialisierte Properties (`input`, `output`, `model`, Queries)
- **`protected`** für Members die nur im Template verwendet werden
- **Lifecycle-Interfaces** implementieren (`implements OnInit`)
- **Feature-basierte Ordnerstruktur** — keine Typ-Ordner wie `components/`, `services/`
- **Ein Konzept pro Datei** — eine Komponente/Direktive/Service pro Datei
- **`class`/`style`-Bindings** bevorzugen statt `ngClass`/`ngStyle`
- **Event-Handler** nach ihrer Aktion benennen, nicht nach dem Event (`saveUserData()` statt `handleClick()`)

# Language

All content in this repository must be written in **English**. This includes:

- Code (variable names, function names, class names)
- Comments and documentation
- UI text and labels
- Commit messages and branch names
- Issue titles and descriptions
- README and other Markdown files
