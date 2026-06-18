# Practica11y

## Purpose

Practica11y is a gamified learning platform for web accessibility. Developers solve interactive challenges in a Monaco editor — the code is rendered live in a sandboxed iframe and automatically analyzed for accessibility.

The application is entirely client-side (no backend) and persists progress locally in the browser.

## Routes

| Path              | Component             | Description                                        |
| ----------------- | --------------------- | -------------------------------------------------- |
| `/challenges`     | `ChallengesPage`      | Overview of all available challenges with filters  |
| `/challenges/:id` | `ChallengeDetailPage` | Challenge workspace with editor, preview, feedback |
| `/about`          | `AboutPage`           | Information about the project and its purpose      |
| `/`               | —                     | Redirect to `/challenges`                          |

All routes use lazy loading via `loadComponent()`.

## Features

- Monaco editor with HTML/CSS support
- Live preview in a sandboxed iframe
- Accessibility analysis (axe-core, DOM tree, keyboard, focus)
- Validation against challenge-specific criteria
- Gamification: XP, levels, achievements
- Local persistence via IndexedDB / localStorage
- Dark/light theme

## Dependencies (Monorepo)

- `@practica11y/challenge-shell` — Challenge workspace
- `@practica11y/challenge-list` — Challenge overview

## Start

```bash
pnpm exec nx serve practica11y
```
