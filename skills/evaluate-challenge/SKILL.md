---
name: evaluate-challenge
description: Evaluates an existing accessibility challenge in the Practica11y app for consistency and quality. Trigger when someone wants to review, audit, check, or evaluate a challenge — verifying that the task description matches the starter code, that validators sufficiently cover the required fixes, and that metadata (points, tags, difficulty, title) is coherent. Produces actionable improvement suggestions that an agent can pick up and implement.
metadata:
  author: Practica11y Team
  version: '1.0'
---

# Evaluating an Existing Challenge

This skill describes how to audit an existing accessibility challenge in the Practica11y
app and produce a structured, actionable evaluation report. The goal is to surface
mismatches between the task, the starter code, the validators, and the metadata — and to
propose concrete improvements that you or another agent can implement afterwards.

This skill is **read-and-analyze first**. Do not change files while evaluating. Collect
findings, then present prioritized suggestions. Only implement changes once the evaluation
is complete (and, ideally, after the user confirms which suggestions to apply).

## When to Use

- A challenge "feels off" — the task asks for something the starter code does not exhibit.
- You want to confirm a challenge is actually solvable and that its validators pass only
  on a correct solution.
- You are reviewing a newly created challenge before enabling it in the registry.
- You want a consistency check on metadata (points vs. difficulty, tags, title, links).

## Inputs You Need

To evaluate a challenge with id `<challenge-id>`, gather:

1. **Content files** — `apps/practica11y/public/content/challenges/<challenge-id>/`
   - `challenge.md` (frontmatter + description)
   - `starter.html` (required)
   - `starter.css`, `starter.js` (optional)
2. **Registry entry** — `apps/practica11y/public/content/challenges/registry.json`
   (is the challenge listed? is it `disabled`?)
3. **Validators** — for each id in the frontmatter `validators` list, read the
   implementation in `libs/challenge/validators/src/lib/<validator-id>.ts`
4. **Pipeline registration** — `libs/features/challenge-shell/src/lib/analysis-pipeline.ts`
   (is each validator registered? note that `valid-html-syntax` is always appended)
5. **Sandbox behavior** — `libs/preview/sandbox/src/lib/sandbox-preview/sandbox-preview.ts`
   to understand how user HTML/CSS/JS is rendered and what DOM state validators receive.

## Evaluation Dimensions

Work through every dimension below. For each, record concrete observations (with file
paths and line references) and classify findings by severity:

- **Blocker** — challenge is broken, unsolvable, or validators pass/fail incorrectly.
- **Major** — task and code/validators are inconsistent; learner would be confused or misled.
- **Minor** — metadata, wording, or polish issues.

### 1. Task ↔ Starter Code Consistency

Verify that the broken behavior described in the task actually exists in the starter code.

- Read the description and "Your Task" section, then read `starter.html` / `.css` / `.js`.
- Confirm every problem the task claims is _present_ in the starter. Example pitfalls:
  - Task says "fields are only marked visually" but the starter JS never adds the visual
    marker (class/inline style) or the CSS for that marker is missing → mismatch.
  - Task references an element/attribute/control that does not exist in the starter.
  - Task describes interactive behavior, but no `starter.js` provides it.
- Confirm the starter does **not** already contain the fix (otherwise the challenge is
  pre-solved and validators pass immediately).
- For interactive challenges, trace the actual runtime behavior: what does the JS do on
  load, on submit, on click? Does the described "broken" state actually occur for the user?

### 2. Validator Sufficiency & Correctness

For each required fix in "Your Task", check that **at least one validator actually
verifies it**. Map every task requirement to a validating check.

- Build a requirement → validator matrix. Every requirement should map to a concrete
  assertion in some validator. Flag requirements with **no** validator coverage.
- Flag validators that pass **trivially** on the unmodified starter (they verify something
  the starter already satisfies and therefore test nothing about the required fix).
  Example: a `form-labels` validator on a starter that already has correct labels.
- Check for **false positives**: could the validator pass without a genuine fix? e.g. it
  accepts a statically hard-coded attribute that is semantically wrong, or a vacuous case.
- Check for **false negatives**: could a correct solution fail the validator? This is
  critical for challenges whose fix is applied **dynamically via JS** (e.g. `aria-invalid`
  added on submit). Validators receive the **rendered DOM**. If a validator inspects only
  the initial static DOM, a correct dynamic solution may never satisfy it unless the
  evaluation flow triggers the relevant interaction. Note how the sandbox/pipeline obtains
  the document (see `analysis-pipeline.ts` and `sandbox-preview.ts`) and whether
  interaction state is captured.
- Confirm each validator id in the frontmatter is **exported** in
  `libs/challenge/validators/src/index.ts` and **registered** in `analysis-pipeline.ts`.
- Confirm validator messages are clear and would actually guide the learner.

### 3. Metadata Coherence (`challenge.md` frontmatter)

Check each frontmatter field against the rest of the challenge:

| Field          | What to verify                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | kebab-case, matches the folder name and the registry entry                                                                        |
| `title`        | descriptive, matches the actual scenario, not duplicated by another challenge                                                     |
| `difficulty`   | `beginner` \| `intermediate` \| `advanced`; matches the real cognitive load (number of concepts, ARIA depth, dynamic JS required) |
| `tags`         | accurate and complete for the topic (e.g. `forms`, `aria`, `keyboard`, `images`, `semantics`); no irrelevant tags                 |
| `points`       | proportional to difficulty and consistent with comparable challenges (compare against peers in the registry)                      |
| `starter`      | every referenced file exists; `html` present                                                                                      |
| `validators`   | every id exists, is exported, and is registered; the set covers the task                                                          |
| `previewTitle` | optional; sensible if present                                                                                                     |
| `links`        | resolve to the right topic (MDN/WCAG/APG/Deque), no dead or off-topic links                                                       |

For `points` and `difficulty`, calibrate by comparing with sibling challenges in
`registry.json` rather than judging in isolation. Note inconsistencies (e.g. a trivial
`beginner` task worth more points than a complex `advanced` one).

### 4. Description Quality

- The problem statement explains _why_ it is an accessibility issue (impact on AT users).
- "Your Task" is specific and testable; each bullet maps to a checkable outcome.
- "Tips" point toward the right APIs/attributes without giving away a copy-paste solution.
- Language is English and consistent with workspace conventions.

### 5. Accessibility of the Challenge Itself

The platform teaches accessibility, so the _solution path_ should be exemplary. Confirm the
intended correct solution would satisfy WCAG 2.2 AA and not merely satisfy the validator.

## Output: Evaluation Report

Produce a concise report in this structure (use plain prose + short lists, not walls of text):

```
## Evaluation: <challenge-id>

### Summary
One or two sentences: overall verdict (solid / needs work / broken) + headline issues.

### Findings
- [Blocker|Major|Minor] <area>: <observation> (file:line) — why it matters.
- ...

### Requirement → Validator Coverage
- Requirement 1 → <validator-id> ✅ / ❌ (gap described)
- Requirement 2 → none ❌
- ...

### Metadata Check
- difficulty / points / tags / title / links: ok or specific issue.

### Suggested Changes (actionable)
1. <concrete change> — files to touch, what to add/modify. (severity)
2. ...
```

### Rules for Suggestions

- Each suggestion must be **concrete and self-contained**: name the file(s), describe the
  exact change, and state the expected outcome. An agent picking up the suggestion should
  not need to re-investigate.
- Order suggestions by severity (Blockers first).
- Prefer fixing **validators** to cover real requirements over weakening the task.
- When the fix is dynamic (JS-applied attributes), explicitly call out whether a new or
  adjusted validator and/or interaction-aware evaluation is needed.
- Do **not** apply changes as part of the evaluation. Present them, then implement only the
  approved ones (re-use the `create-challenge` skill conventions when editing).

## Quick Checklist

- [ ] Task description matches the actual broken behavior in the starter code
- [ ] Starter code does not already contain the fix
- [ ] Every task requirement maps to a real validator assertion
- [ ] No validator passes trivially on the unmodified starter
- [ ] No correct (incl. dynamic-JS) solution can fail the validators
- [ ] All validator ids are exported and registered in the pipeline
- [ ] `difficulty`, `points`, `tags`, `title` are coherent and calibrated vs. peers
- [ ] All referenced starter files exist; links resolve to the right topics
- [ ] Registry entry present and `disabled` flag intentional
- [ ] Evaluation report written with prioritized, actionable suggestions

## File Paths Overview

```
apps/practica11y/public/content/challenges/
├── registry.json                          ← Challenge list + disabled flags
└── <challenge-id>/
    ├── challenge.md                       ← Frontmatter + description
    ├── starter.html                       ← Broken HTML code
    ├── starter.css                        ← Optional: styling
    └── starter.js                         ← Optional: JavaScript

libs/challenge/validators/src/
├── index.ts                               ← All validator exports
└── lib/<validator-id>.ts                  ← Validator implementations

libs/features/challenge-shell/src/lib/
└── analysis-pipeline.ts                   ← Validator registration

libs/preview/sandbox/src/lib/sandbox-preview/
└── sandbox-preview.ts                     ← How user code is rendered for analysis
```
