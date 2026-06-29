# Testing Strategy

## Overview

The testing strategy follows the classic test pyramid with a focus on fast, deterministic tests:

```
        ┌─────────┐
        │   E2E   │  ← Few, critical workflows
        ├─────────┤
        │  Integ  │  ← Component interaction, signal flow
        ├─────────┤
        │  Unit   │  ← Majority: logic, parsers, services
        └─────────┘
```

| Test Type         | Proportion | Speed         | Purpose                       |
| ----------------- | ---------- | ------------- | ----------------------------- |
| Unit Tests        | ~70%       | Fast (ms)     | Test isolated logic           |
| Integration Tests | ~20%       | Medium (ms–s) | Verify component interaction  |
| E2E Tests         | ~10%       | Slow (s)      | Validate end-to-end workflows |

## Tools

| Tool                         | Use Case                            |
| ---------------------------- | ----------------------------------- |
| **Vitest**                   | Unit and integration tests          |
| **@testing-library/angular** | Component rendering and interaction |
| **jsdom**                    | DOM simulation for unit tests       |
| **Playwright**               | End-to-end tests                    |
| **@nx/playwright**           | Nx integration for Playwright e2e   |
| **@vitest/coverage-v8**      | Code coverage                       |
| **axe-core**                 | Accessibility audit in E2E          |

## Test Types

### Unit Tests

Isolated logic without external dependencies:

- **Validators**: Challenge validation logic (axe-no-violations, heading-structure, form-labels)
- **Parsers**: Frontmatter parsing, YAML extraction, body extraction
- **Services**: Gamification calculations (XP, level, achievements)
- **Models**: Data structure invariants, type guards
- **Utilities**: Helper functions, transformers

### Integration Tests

Interaction between multiple components:

- **Signal flow**: Monaco Editor → Analysis Pipeline → Feedback Panel
- **postMessage**: Sandbox iframe ↔ Accessibility Engine
- **Persistence**: Gamification Service ↔ Progress Store
- **axe-core**: Integration with known DOM structures
- **Component rendering**: UI components with real data

### E2E Tests

Complete user workflows via Playwright:

- **Challenge flow**: Load challenge → Edit code → Solve challenge → Receive feedback
- **Keyboard navigation**: Full operability via keyboard
- **Accessibility audit**: Run axe-core on the platform itself
- **Responsive design**: Behavior on different viewports

#### Challenge E2E Tests

A dedicated Nx project at `apps/practica11y-e2e/` provides automated end-to-end coverage for every registered challenge. It uses `@nx/playwright` for Nx integration.

**Dynamic test generation**: Tests are generated automatically from `apps/practica11y/public/content/challenges/registry.json` at test-collection time. Adding a new challenge to the registry automatically creates e2e coverage — no manual test file updates are needed.

**Two-phase validation pattern**: Each challenge is tested in two phases:

1. **Starter code fails** — Navigate to the challenge page, click "Check Solution" with default starter code loaded, and assert that validation errors are displayed and the score has not increased. This confirms the challenge is not trivially solvable.
2. **Solution code passes** — Load the reference solution files into the corresponding Monaco editor tabs, click "Check Solution", and assert that no validation errors are displayed and the score has increased. This confirms solution files and validators are correct.

Challenges without a `solution` field in their frontmatter only run the first phase (starter-fails verification).

**Running locally**:

```bash
# Launches Playwright UI mode (default configuration)
pnpm nx e2e practica11y-e2e

# Runs headless, CI-like execution
pnpm nx e2e practica11y-e2e --configuration=ci
```

The local configuration (`defaultConfiguration: "local"`) opens Playwright UI mode for interactive debugging. The `ci` configuration runs headless. In both cases, the Playwright `webServer` config starts the application automatically if it is not already running.

**CI execution**: The e2e tests run as a dedicated `e2e` job in `.github/workflows/checks.yml` after the `build` job. The job installs Playwright browsers (`pnpm exec playwright install --with-deps chromium`), then runs the tests using `serve-static` to serve the production build. Failures block the workflow — no `continue-on-error` is set. Playwright traces are captured on the first retry for debugging.

## Conventions

### File Structure

Test files are located in the `__tests__/` folder of the respective library or next to the source file:

```text
libs/
  challenge/
    models/src/lib/
      __tests__/
        challenge.model.spec.ts
      challenge.model.ts
    loader/src/lib/
      __tests__/
        challenge-loader.spec.ts
        frontmatter-parser.spec.ts
      challenge-loader.ts
  accessibility/
    tree/src/lib/
      __tests__/
        tree-generator.spec.ts
      tree-generator.ts
  shared/
    util/src/lib/
      __tests__/
        gamification.spec.ts
        progress-store.spec.ts
      gamification.ts
      progress-store.ts
```

### Naming Convention

- Test files: `*.spec.ts`
- Describe blocks: class/function name
- It blocks: describe expected behavior in natural language

### Test Structure (AAA Pattern)

Every test follows the Arrange-Act-Assert pattern:

```typescript
describe('Gamification', () => {
  it('should add XP points after challenge completion', () => {
    // Arrange
    const gamification = new Gamification();
    gamification.currentXP.set(100);

    // Act
    gamification.addXP(50);

    // Assert
    expect(gamification.currentXP()).toBe(150);
  });
});
```

### Running Tests

```bash
# Single project
pnpm nx test <project-name>

# All tests
pnpm nx run-many --target=test

# Only affected tests (since last commit)
pnpm nx affected --target=test

# With coverage
pnpm nx test <project-name> --coverage

# E2E tests (Playwright UI mode)
pnpm nx e2e practica11y-e2e

# E2E tests (headless, CI-like)
pnpm nx e2e practica11y-e2e --configuration=ci
```

## Coverage

Code coverage is measured with `@vitest/coverage-v8`.

### Target Values

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 80%     | 90%    |
| Branches   | 75%     | 85%    |
| Functions  | 80%     | 90%    |
| Lines      | 80%     | 90%    |

### Configuration

Coverage is configured in `vitest.workspace.ts` or the individual project `vite.config.ts` files and can be activated via flag:

```bash
pnpm nx test <project-name> --coverage
```

## Best Practices

- **No mocks for core logic**: Tests validate real functionality, not mocked results
- **Deterministic tests**: No dependency on timing, network, or random values
- **Fast feedback**: Unit tests run in milliseconds — runnable on every change
- **Meaningful error messages**: Test names clearly describe the expected behavior
- **Independent tests**: No test depends on the execution order of other tests
