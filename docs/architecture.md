# Architecture Documentation

## System Overview

Practica11y is a fully client-side, gamified learning platform for web accessibility. The application is built on Angular 22+ with Standalone Components, Signals, and Zoneless Change Detection in an Nx monorepo.

The core data flow follows a unidirectional pattern:

```mermaid
graph TD
    A[Challenge Loader] -->|Challenge data| B[Challenge Shell]
    B --> C[Monaco Editor - @ng-catbee/monaco-editor]
    B --> D[Live Preview - Sandbox iframe]
    B --> E[Accessibility Tree View]
    B --> P[Virtual Screen Reader]
    B --> CC[Color Contrast Checker]
    B --> F[Feedback Panel]

    C -->|Signal: codeContent| G[Analysis Pipeline]
    G -->|Debounce 300ms| D
    D -->|postMessage: DOM ready| H[Accessibility Engine]
    H --> I[axe-core]
    H --> J[dom-accessibility-api]
    H --> K[Keyboard Analysis]
    H --> L[Focus Analysis]
    H -->|Results| M[Validator Service]
    M -->|ValidationResult| F
    H -->|AccessibilityNode Tree| E
    D -->|sandboxDocument| P
    P -->|Guidepup spoken phrase log| Q[Web Speech API]

    N[Gamification Service] -->|XP, Level, Achievements| O[Progress Store]
    M -->|Challenge completed| N
```

No backend required — all data is persisted locally in the browser (localStorage / IndexedDB). Optionally, users can sign in via GitHub (OAuth Device Flow) to sync progress across devices — stored in a private GitHub Gist (`practica11y-sync.json`).

## Nx Library Architecture

The application is organized as an Nx monorepo. Each domain has its own libraries with clear responsibilities:

```mermaid
graph LR
    subgraph apps
        APP[practica11y]
    end

    subgraph libs/features
        FS[challenge-shell]
        FL[challenge-list]
        FF[challenge-feedback]
        FAT[accessibility-tree]
        FVSR[virtual-screen-reader]
        FCC[color-contrast-checker]
    end

    subgraph libs/challenge
        CM[models]
        CL[loader]
        CV[validators]
    end

    subgraph libs/preview
        PS[sandbox]
    end

    subgraph libs/accessibility
        AX[axe]
        AT[tree]
        AK[keyboard]
        AF[focus]
    end

    subgraph libs/shared
        SU[ui]
        SUT[util]
        ST[types]
    end

    APP --> FS
    APP --> FL
    FS --> PS
    FS --> FF
    FS --> FAT
    FS --> FVSR
    FS --> FCC
    FS --> CM
    FL --> CM
    FL --> CL
    FF --> CV
    FAT --> AT
    CV --> AX
    CV --> AK
    CV --> AF
    PS --> ST
    CL --> CM
    FF --> SU
```

## Key Feature Components

### challenge-shell

The `challenge-shell` library (`libs/features/challenge-shell/`) orchestrates the editor panel, preview, accessibility tools, and feedback for a given challenge.

#### EditorDiffView

**Location:** `libs/features/challenge-shell/src/lib/editor-diff-view/`

A standalone Angular component that renders stacked Monaco diff editors (one per available language) for comparing the challenge's starter code against the user's current code. It uses `CatbeeMonacoDiffEditor` from `@ng-catbee/monaco-editor` and lives within the existing `challenge-shell` library — no additional Nx library is needed.

The component receives an array of `DiffLanguageEntry` objects and displays a vertical stack of diff editors with language labels. The original (left) side shows the starter code (read-only), and the modified (right) side shows the current editor content (editable). Changes on the modified side propagate back to the parent via an output event.

## Dependency Rules

Clear import restrictions prevent circular dependencies and enforce the layered architecture:

| Library Type     | May Import                                            |
| ---------------- | ----------------------------------------------------- |
| `apps/`          | `features/`, `shared/`                                |
| `features/`      | `challenge/`, `preview/`, `accessibility/`, `shared/` |
| `challenge/`     | `challenge/`, `shared/`                               |
| `preview/`       | `preview/`, `shared/`                                 |
| `accessibility/` | `accessibility/`, `shared/`                           |
| `shared/`        | only other `shared/` libs                             |

### Principles

- **Unidirectional dependency flow**: Apps → Features → Domain libs → Shared
- **No cross-imports**: One domain (e.g., `preview/`) never imports from another domain (e.g., `challenge/`)
- **Shared as foundation**: Only `shared/` libs are used by all other layers
- **Nx Enforce Boundaries**: These rules are enforced via Nx tags and the `@nx/enforce-module-boundaries` ESLint rule

## Editor Panel Architecture

The `ChallengeShell` editor panel supports two view modes: NormalView (tabbed Monaco editors) and DiffView (stacked diff editors). Switching between them is controlled by a `diffViewActive` signal.

### Panel Header Layout

The editor panel header contains three elements side by side:

1. `<a11y-editor-tabs>` — language tab bar (hidden when diff view is active)
2. Diff toggle `<button>` — switches between NormalView and DiffView
3. `<a11y-editor-actions>` — editor toolbar actions

### Conditional Rendering

The panel body uses Angular's `@if` control flow to swap views:

- `@if (!diffViewActive())` — renders the normal tabbed editors
- `@if (diffViewActive())` — renders `<a11y-editor-diff-view>` with bound entries and options

### Accessibility

- The diff toggle button uses `aria-pressed` to communicate its current state to assistive technologies.
- A visually hidden `aria-live="polite"` region announces view mode changes to screen readers (e.g., "Switched to diff view").
- Each stacked diff editor section has an `aria-label` identifying the language (e.g., "HTML diff editor").
- The toggle is a native `<button>`, ensuring keyboard operability via Enter and Space without extra handlers.
