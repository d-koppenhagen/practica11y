# Practica11y

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Sponsor](https://img.shields.io/badge/Sponsor-♥-ff69b4)](https://github.com/sponsors/d-koppenhagen)

<p align="center">
  <strong><a href="https://practica11y.dev">practica11y.dev</a></strong>
</p>

Practica11y is a gamified, browser-based learning platform for web accessibility. Developers solve interactive challenges directly in the browser to learn the practical implementation of accessibility.

The mission is to raise awareness for web accessibility, sharpen understanding of WCAG guidelines, and turn inclusive development into a natural habit. Whether you're just starting out or deepening your expertise — hands-on practice makes the difference.

The platform is entirely client-side — no backend required. All progress is stored locally in the browser.

## Prerequisites

- **Node.js** >= 24
- **pnpm** >= 11
- **Git**

## Installation

```bash
pnpm install
```

## Development

### Start the app

```bash
pnpm nx serve practica11y
```

The application will be available at `http://localhost:4200`.

### Run tests

```bash
pnpm nx run-many --target=test
```

### Run lint

```bash
pnpm nx run-many --target=lint
```

### Create a build

```bash
pnpm nx build practica11y
```

### Format code

```bash
pnpm exec prettier --write .
```

## Project Structure

The project is organized as an **Nx monorepo**. The application and reusable libraries are clearly separated:

```text
apps/
  practica11y/              # Angular App (Standalone Components, Signals, Zoneless)

libs/
  challenge/
    models/                 # Challenge data models
    loader/                 # Challenge loading and frontmatter parsing
    validators/             # Validation logic (generic + challenge-specific)

  editor/
    monaco/                 # Monaco editor wrapper component

  preview/
    sandbox/                # Sandboxed iframe for live preview

  accessibility/
    axe/                    # axe-core integration
    tree/                   # Accessibility tree generator
    keyboard/               # Keyboard analysis
    focus/                  # Focus analysis

  features/
    challenge-shell/        # Main challenge view with analysis pipeline
    challenge-list/         # Challenge overview list
    challenge-feedback/     # Feedback panel
    accessibility-tree/     # Tree visualization

  shared/
    ui/                     # Shared UI components
    util/                   # Gamification, ProgressStore, ErrorHandler
    types/                  # Shared TypeScript types
```

## Tech Stack

- **Angular** 22+ (Standalone Components, Signals, Zoneless Change Detection)
- **Nx** (Monorepo build system)
- **Tailwind CSS** 4
- **Vitest** (Unit and integration tests)
- **Monaco Editor** (Code editor)
- **axe-core** + **dom-accessibility-api** (Accessibility analysis)
- **TypeScript** (strict mode)
- **pnpm** (Package manager)

## Contributing

Contributions are welcome! Whether it's reporting bugs, suggesting new challenges, improving documentation, or submitting pull requests — every bit helps make accessibility education better.

- **Report a bug or request a feature**: [Open an issue](https://github.com/d-koppenhagen/practica11y/issues)
- **Submit a pull request**: Fork the repo, create a branch, and open a PR
- **Suggest a challenge**: Have an idea for a new accessibility challenge? Open an issue and describe it

Please make sure your contributions follow the existing code style and pass all tests before submitting.

## Sponsoring

If Practica11y helps you on your accessibility journey, consider supporting its development:

[**Sponsor on GitHub**](https://github.com/sponsors/d-koppenhagen)

Every contribution — big or small — helps keep this project alive and growing.

## Author

**Danny Koppenhagen**

- Website: [k9n.dev](https://k9n.dev)
- GitHub: [@d-koppenhagen](https://github.com/d-koppenhagen)
- Bluesky: [@k9n.dev](https://bsky.app/profile/k9n.dev)
- LinkedIn: [d-koppenhagen](https://www.linkedin.com/in/d-koppenhagen)

## Deployment

The application is deployed via **GitHub Pages** and available at [practica11y.dev](https://practica11y.dev).

The build output (`dist/apps/practica11y/browser`) is published to GitHub Pages. A `CNAME` file in the `public/` folder ensures the custom domain is preserved on each deploy.

## Documentation

Architecture documentation and further details can be found in the `docs/` folder.

## License

MIT
