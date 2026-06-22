---
name: create-challenge
description: Creates a new accessibility challenge for the Practica11y app. Trigger when someone wants to add, scaffold, or create a new challenge including content, starter code, validators, and registry integration.
metadata:
  author: Practica11y Team
  version: '1.0'
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
starter:
  html: starter.html # Required
  css: starter.css # Optional
  js: starter.js # Optional
validators:
  - <validator-id> # One or more validator IDs
previewTitle: 'Custom Preview Title' # Optional, default: "Challenge: {title} | Preview"
links:
  - text: 'MDN: Relevant Topic'
    url: 'https://developer.mozilla.org/...'
  - text: 'WCAG: Matching Success Criterion'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/...'
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/<number>'
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
| `starter`    | `object`                                     | Paths to starter files (at least `html`)                             |
| `validators` | `string[]`                                   | IDs of validators that check the solution                            |

**Optional fields:**

| Field           | Type              | Description                                             |
| --------------- | ----------------- | ------------------------------------------------------- |
| `previewTitle`  | `string`          | Custom title for the preview iframe                     |
| `links`         | `{ text, url }[]` | External reference links (MDN, WCAG, Deque, etc.)       |
| `discussionUrl` | `string`          | URL to the GitHub Discussions thread for this challenge |

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

### 3. Update the Registry

Add the challenge to `apps/practica11y/public/content/challenges/registry.json`:

```json
{
  "challenges": [{ "id": "existing-challenge" }, { "id": "<challenge-id>" }]
}
```

The order determines the display order in the challenge list.

### 4. Create a GitHub Discussion Thread

Each challenge has a linked discussion thread where learners can ask questions,
share hints, and discuss approaches.

**Create the discussion using the GitHub CLI:**

```bash
gh discussion create \
  --category "Challenges" \
  --title "Challenge: <Challenge Title>" \
  --body "Discuss the **<Challenge Title>** challenge.

🔗 [Open challenge on practica11y.dev](https://practica11y.dev/challenges/<challenge-id>)

Share your approach, ask questions, or help others. Please use \`<details>\` tags for code spoilers."
```

The command outputs the discussion URL (e.g. `https://github.com/d-koppenhagen/practica11y/discussions/42`).

**Add the URL to the challenge frontmatter:**

```yaml
discussionUrl: 'https://github.com/d-koppenhagen/practica11y/discussions/42'
```

The discussion link appears in:

- The **Feedback panel header** (speech bubble icon with "Discuss" label)
- The **Success dialog** shown after solving the challenge

### 5. Create or Reuse a Validator

#### 5.1 Check if an existing validator fits

Available validators in `libs/challenge/validators/src/index.ts`:

| Validator ID             | Checks                         |
| ------------------------ | ------------------------------ |
| `axe-no-violations`      | No axe-core violations         |
| `has-landmarks`          | At least one landmark present  |
| `has-all-landmarks`      | All expected landmarks present |
| `has-skip-link`          | Skip link present              |
| `button-link-semantics`  | Correct button/link semantics  |
| `focus-after-navigation` | Focus set after navigation     |
| `heading-structure`      | Correct heading hierarchy      |
| `form-labels`            | Form fields have labels        |
| `color-contrast`         | Sufficient color contrast      |
| `semantic-button`        | Semantic button instead of div |
| `keyboard-accessible`    | Keyboard accessibility         |
| `image-alt-text`         | Images have alt text           |
| `focus-trap-implemented` | Focus trap implemented         |
| `valid-html-syntax`      | Valid HTML                     |
| `page-title`             | Page title present             |

#### 5.2 Create a new validator

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

#### 5.3 Export the validator

Add the export to `libs/challenge/validators/src/index.ts`:

```typescript
export { myValidator } from './lib/my-validator';
```

#### 5.4 Register the validator in the AnalysisPipeline

In `libs/features/challenge-shell/src/lib/analysis-pipeline.ts`:

1. Add the import:

```typescript
import { myValidator } from '@practica11y/validators';
```

2. Register in the constructor:

```typescript
this.challengeValidator.registerValidator(myValidator);
```

### 6. Test Locally

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

### 7. Write Tests (optional, recommended for new validators)

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
- [ ] `challenge.md` with complete frontmatter and description
- [ ] `starter.html` with realistic, broken code
- [ ] Optional: `starter.css` and/or `starter.js`
- [ ] Entry added to `registry.json`
- [ ] GitHub Discussion created via `gh discussion create --category "Challenges"` and `discussionUrl` added to frontmatter
- [ ] Validator available (existing or newly created)
- [ ] If new validator: export in `index.ts` + registration in `AnalysisPipeline`
- [ ] Tested locally — challenge loads, validation works
- [ ] Optional: unit tests for new validator

## File Paths Overview

```
apps/practica11y/public/content/challenges/
├── registry.json                          ← Challenge list
└── <challenge-id>/
    ├── challenge.md                       ← Frontmatter + description
    ├── starter.html                       ← Broken HTML code
    ├── starter.css                        ← Optional: styling
    └── starter.js                         ← Optional: JavaScript

libs/challenge/validators/src/
├── index.ts                               ← All validator exports
└── lib/
    ├── <validator-id>.ts                  ← Validator implementation
    └── __tests__/
        └── <validator-id>.spec.ts         ← Tests

libs/features/challenge-shell/src/lib/
└── analysis-pipeline.ts                   ← Validator registration
```
