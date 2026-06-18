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
