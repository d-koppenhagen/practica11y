---
name: create-challenge
description: Creates a new accessibility challenge for the Practica11y app. Trigger when someone wants to add, scaffold, or create a new challenge including content, starter code, validators, and registry integration.
metadata:
  author: Practica11y Team
  version: '1.1'
---

# Creating a New Challenge

This skill describes the complete workflow for adding a new accessibility challenge to the Practica11y app.

## Architecture Overview

Challenges consist of:

1. **Content files** – Markdown with YAML frontmatter + starter code (HTML, optional CSS/JS)
2. **Registry entry** – Addition to `registry.json` so the loader can find the challenge
3. **Validator(s)** – TypeScript functions that check whether the user's solution is correct
4. **Pipeline registration** – New validators must be registered in the `AnalysisPipeline`

## Step-by-Step Guide

### 1. Determine the Challenge ID

The ID is a kebab-case string that determines both the folder name and the URL:

- URL: `/challenges/<challenge-id>`
- Folder: `apps/practica11y/public/content/challenges/<challenge-id>/`

Examples: `missing-alt-text`, `button-vs-link`, `focus-trap`

### 2. Create Folder and Content Files

Create the folder at:

```
apps/practica11y/public/content/challenges/<challenge-id>/
```

#### 2.1 `challenge.md` — Frontmatter + Description

```markdown
---
id: '<challenge-id>'
title: 'Descriptive Title'
difficulty: beginner # beginner | intermediate | advanced
tags:
  - semantics
  - aria
points: 100 # Points awarded when solved
createdAt: '2026-01-15' # ISO date (YYYY-MM-DD) when challenge was created
starter:
  html: starter.html # Required
  css: starter.css # Optional
  js: starter.js # Optional
solution:
  html: solution.html # Optional: reference solution file(s)
  css: solution.css # Optional
  js: solution.js # Optional
validators:
  - color-contrast # ← ALWAYS include (default common validator)
  - axe-no-violations # ← ALWAYS include (default common validator)
  - <validator-id> # Challenge-specific validator(s)
previewTitle: 'Custom Preview Title' # Optional, default: "Challenge: {title} | Preview"
links:
  - text: 'MDN: Relevant Topic'
    url: 'https://developer.mozilla.org/...'
  - text: 'WCAG: Matching Success Criterion'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/...'
---

Describe the problem here — what is broken and why is it an accessibility issue?

## Your Task

Explain clearly and concisely what the user needs to fix:

- Point 1
- Point 2
- Point 3

## Tips

- Helpful hints for the solution
- References to relevant HTML elements or ARIA attributes
```

**Required frontmatter fields:**

| Field        | Type                                         | Description                                                          |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------- |
| `id`         | `string`                                     | Unique kebab-case ID                                                 |
| `title`      | `string`                                     | Display name of the challenge                                        |
| `difficulty` | `'beginner' \| 'intermediate' \| 'advanced'` | Difficulty level                                                     |
| `tags`       | `string[]`                                   | Topic tags (e.g. `semantics`, `aria`, `keyboard`, `forms`, `images`) |
| `points`     | `number`                                     | Points for gamification                                              |
| `createdAt`  | `string`                                     | ISO date (YYYY-MM-DD) when the challenge was created                 |
| `starter`    | `object`                                     | Paths to starter files (at least `html`)                             |
| `validators` | `string[]`                                   | IDs of validators that check the solution                            |

**Optional fields:**

| Field           | Type              | Description                                                                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `updatedAt`     | `string`          | ISO date (YYYY-MM-DD) when the challenge was last updated (content change). Triggers "Updated" badge for 7 days. |
| `solution`      | `object`          | Paths to solution files (html, css, js) — shown via "Peek Solution"                                              |
| `previewTitle`  | `string`          | Custom title for the preview iframe                                                                              |
| `links`         | `{ text, url }[]` | External reference links (MDN, WCAG, Deque, etc.)                                                                |
| `discussionUrl` | `string`          | URL to a GitHub Discussion for this challenge                                                                    |

**Validator convention — default common validators:**

Every challenge **must** include these two validators as the first entries:

1. `color-contrast` — ensures the starter/solution CSS meets WCAG contrast ratios
2. `axe-no-violations` — catches general axe-core violations (label-name, aria rules, etc.)

Then add challenge-specific validator(s) after them. Example:

```yaml
validators:
  - color-contrast
  - axe-no-violations
  - button-link-semantics
```

#### 2.2 `starter.html` — The Broken HTML Code (Required)

Create HTML that contains a specific accessibility problem. The user must fix it in the editor.

```html
<article class="blog-post">
  <h1>Our New Store in Berlin</h1>
  <img src="https://picsum.photos/seed/store/300/200" class="post-image" />
  <p>We are excited to announce the opening of our new store...</p>
</article>
```

**Rules:**

- Only the relevant HTML snippet — no `<html>`, `<head>`, `<body>`
- Realistic, relatable scenario
- Exactly one accessibility problem (or a clearly defined group)
- Visual appearance should look presentable (via CSS)

#### 2.3 `starter.css` — Styling (Optional)

```css
.blog-post {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
```

#### 2.4 `starter.js` — JavaScript (Optional)

Only needed when the challenge involves interactive behavior:

```javascript
function addToCart(item) {
  alert(item + ' added to cart!');
}
```

#### 2.5 Solution Files (Optional, recommended)

Provide reference solution files so users can "Peek Solution" when stuck. Solution files live in the same challenge folder and are referenced in the `solution:` frontmatter block.

Create one or more of:

- `solution.html` — the fixed HTML
- `solution.css` — the fixed CSS (when only CSS changes are needed)
- `solution.js` — the fixed JS

The solution should be the minimal correct fix for the accessibility issue. Only include solution files for the file types that actually need changes.

Example frontmatter:

```yaml
solution:
  html: solution.html
  css: solution.css
```

### 3. Update the Registry

Add the challenge to `apps/practica11y/public/content/challenges/registry.json`:

```json
{
  "challenges": [{ "id": "existing-challenge" }, { "id": "<challenge-id>" }]
}
```

The order determines the display order in the challenge list.

### 4. Create or Reuse a Validator

#### 4.1 Check if an existing validator fits

Available validators in `libs/challenge/validators/src/index.ts`:

| Validator ID               | Checks                                          |
| -------------------------- | ----------------------------------------------- |
| `axe-no-violations`        | No axe-core violations                          |
| `has-landmarks`            | At least one landmark present                   |
| `has-all-landmarks`        | All expected landmarks present                  |
| `has-skip-link`            | Skip link present                               |
| `button-link-semantics`    | Correct button/link semantics                   |
| `focus-after-navigation`   | Focus set after navigation                      |
| `heading-structure`        | Correct heading hierarchy                       |
| `form-labels`              | Form fields have labels                         |
| `color-contrast`           | Sufficient color contrast                       |
| `semantic-button`          | Semantic button instead of div                  |
| `keyboard-accessible`      | Keyboard accessibility                          |
| `image-alt-text`           | Images have alt text                            |
| `focus-trap-implemented`   | Focus trap implemented                          |
| `valid-html-syntax`        | Valid HTML                                      |
| `page-title`               | Page title present                              |
| `image-alt-text-limit`     | Alt text within character limit                 |
| `image-aria-describedby`   | Image has aria-describedby for long description |
| `reduced-motion`           | Respects prefers-reduced-motion                 |
| `aria-invalid-errors`      | Uses aria-invalid for form errors               |
| `error-focus-management`   | Focus moves to error on validation              |
| `video-has-captions`       | Video element has captions track                |
| `live-region-pattern`      | ARIA live region for dynamic updates            |
| `no-disabled-submit`       | Submit button not disabled                      |
| `focus-visible`            | Focus indicator visible                         |
| `interactive-element-name` | Buttons and links have accessible names         |

#### 4.2 Create a new validator

Create a file at `libs/challenge/validators/src/lib/<validator-id>.ts`:

```typescript
import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Description of what the validator checks.
 */
export const myValidator: Validator = {
  id: '<validator-id>',

  validate(document: Document, _context?: unknown): ValidationResult {
    // Validation logic against the Document
    const issues: string[] = [];

    // ... DOM queries and checks ...

    const passed = issues.length === 0;

    return {
      validatorId: '<validator-id>',
      passed,
      message: passed ? 'Success message.' : `${issues.length} issue(s) found.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
```

**Interface reference:**

```typescript
interface Validator {
  id: string;
  validate(document: Document, context?: unknown): ValidationResult;
}

interface ValidationResult {
  validatorId: string;
  passed: boolean;
  message: string;
  details?: string;
}
```

**Validator rules:**

- The `id` must exactly match the string in the frontmatter `validators` array
- The validator receives the `Document` from the sandbox (user code after rendering)
- `context` optionally contains the `AccessibilityAnalysisResult` (axe results, etc.)
- Provide clear, helpful error messages in `message` and `details`
- The export name is camelCase (e.g. `imageAltText`, `buttonLinkSemantics`)

#### 4.3 Export the validator

Add the export to `libs/challenge/validators/src/index.ts`:

```typescript
export { myValidator } from './lib/my-validator';
```

#### 4.4 Register the validator in the AnalysisPipeline

In `libs/features/challenge-shell/src/lib/analysis-pipeline.ts`:

1. Add the import:

```typescript
import { myValidator } from '@practica11y/validators';
```

2. Register in the constructor:

```typescript
this.challengeValidator.registerValidator(myValidator);
```

### 5. Test Locally

```bash
pnpm start
```

1. Open the app in the browser
2. Navigate to `/challenges/<challenge-id>`
3. Verify:
   - Challenge loads correctly (title, description, links)
   - Starter code appears in the editor
   - Preview shows the rendered code
   - Validator fails on unmodified code
   - After applying the correct fix: validator reports success

### 6. Write Tests (optional, recommended for new validators)

Create `libs/challenge/validators/src/lib/__tests__/<validator-id>.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { myValidator } from '../my-validator';

describe('myValidator', () => {
  it('passes when condition is met', () => {
    const doc = new DOMParser().parseFromString(
      '<img src="test.jpg" alt="A test image">',
      'text/html',
    );
    const result = myValidator.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('fails when condition is not met', () => {
    const doc = new DOMParser().parseFromString(
      '<img src="test.jpg">',
      'text/html',
    );
    const result = myValidator.validate(doc);
    expect(result.passed).toBe(false);
  });
});
```

Run tests:

```bash
pnpm nx test validators
```

## Checklist

- [ ] Folder `apps/practica11y/public/content/challenges/<id>/` created
- [ ] `challenge.md` with complete frontmatter and description (including `createdAt` set to today's date)
- [ ] `starter.html` with realistic, broken code
- [ ] Optional: `starter.css` and/or `starter.js`
- [ ] Solution file(s) provided (`solution.html`, `solution.css`, `solution.js`)
- [ ] `solution:` block in frontmatter references the solution file(s)
- [ ] Entry added to `registry.json`
- [ ] Validators include `color-contrast` + `axe-no-violations` as first two entries
- [ ] Challenge-specific validator available (existing or newly created)
- [ ] If new validator: export in `index.ts` + registration in `AnalysisPipeline`
- [ ] Tested locally — challenge loads, validation works
- [ ] Optional: unit tests for new validator

## File Paths Overview

```text
apps/practica11y/public/content/challenges/
├── registry.json                          ← Challenge list
└── <challenge-id>/
    ├── challenge.md                       ← Frontmatter + description
    ├── starter.html                       ← Broken HTML code
    ├── starter.css                        ← Optional: styling
    ├── starter.js                         ← Optional: JavaScript
    ├── solution.html                      ← Optional: reference solution HTML
    ├── solution.css                       ← Optional: reference solution CSS
    └── solution.js                        ← Optional: reference solution JS

libs/challenge/validators/src/
├── index.ts                               ← All validator exports
└── lib/
    ├── <validator-id>.ts                  ← Validator implementation
    └── __tests__/
        └── <validator-id>.spec.ts         ← Tests

libs/features/challenge-shell/src/lib/
└── analysis-pipeline.ts                   ← Validator registration
```
