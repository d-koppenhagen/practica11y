# Accessibility

Accessibility is the whole point of Practica11y. We build a learning platform
that teaches people how to make the web usable for everyone, so the platform
itself has to be something everyone can use. If you rely on a keyboard, a
screen reader, zoom, high contrast, or any other assistive technology, you
should be able to browse challenges, work through them, and track your
progress without hitting a wall.

This page explains what we aim for, what we ask of contributors, and how to
tell us when something gets in your way. If you landed here because you ran
into a barrier, skip ahead to [Reporting accessibility
issues](#reporting-accessibility-issues) — we want to hear about it.

## A note on challenge content

Practica11y teaches accessibility through hands-on practice, so the **challenge
exercises deliberately contain inaccessible code**. These are intentional
negative examples: the whole task is to spot the barriers and fix them, with a
reference solution provided for comparison. That inaccessible code lives inside
the sandboxed preview that renders a challenge's starter files — it is learning
material, not a defect.

Everything in this statement — our commitments, priorities, and the issues we
want reported — is about the **Practica11y platform itself**: the pages,
navigation, menus, dialogs, and controls you use to browse and work through
challenges. The barriers inside a challenge's starter code are expected and do
not need to be reported.

## Priorities

Our goal is for the interface to work smoothly whether you use a mouse, a
keyboard, or assistive technology. In practice we focus on:

- **Keyboard access** — every interactive part of the app should be reachable
  and operable with the keyboard alone, with a visible focus indicator and a
  tab order that follows the layout.
- **Screen reader support** — pages use semantic HTML and ARIA only where it
  adds meaning, so the structure and controls are announced clearly.
- **Readable content** — plain language, sensible headings, and text contrast
  of at least 4.5:1 for normal text and 3:1 for large text.
- **Respecting user settings** — we honor `prefers-reduced-motion` and aim to
  stay usable when the page is zoomed or text is enlarged.

We treat **WCAG 2.2 AA** as the standard we design against. That is an
aspirational target that guides our work, not a verified conformance claim. We
have not completed a formal, dated accessibility audit, so we do not claim
conformance. If we do publish one later, it will state the scope, date, method,
and who performed it.

## Contributor expectations

Because this is an accessibility teaching platform, the UI we ship is meant to
be exemplary. If you contribute a user-facing change, we ask that you:

- Build with semantic HTML first and add ARIA only when semantics fall short.
- Make sure new interactive elements work with the keyboard and show a clear
  focus state.
- Keep color contrast within the thresholds above.
- Respect `prefers-reduced-motion` for any animation or transition.

For verification, the project uses:

- **axe-core** for automated accessibility assertions in tests.
- **Vitest** with `@testing-library/angular` and `jsdom` for component tests.
- **ESLint** (`angular-eslint`) for template and code checks.

Please run the relevant tests and lint checks before opening a pull request,
and in the PR description note how you verified the accessibility of your
change — for example, which keyboard paths you walked through, which screen
reader you tried, or which automated checks you ran. Automated tools catch
only part of the picture, so a short note on manual testing is valuable.

## Reporting accessibility issues

If something blocks you, please open an issue on our
[GitHub issue tracker](https://github.com/d-koppenhagen/practica11y/issues).
You do not need to disclose anything about yourself or any disability.

Context that helps us reproduce and fix the problem:

- What you were trying to do (the task or challenge).
- The page URL or the part of the app where it happened.
- What you expected versus what actually happened.
- Your browser and version.
- Your operating system.
- Any assistive technology you were using (and its version, if you know it).

Screenshots or screen recordings are welcome but completely optional. A plain
text description of the barrier is enough to get us started.

### Severity

When we triage an issue, we label its severity by how much it affects your
ability to finish a task. Maintainers assign or confirm the label — as a
reporter you do not need to pick one.

- **Critical** — a barrier makes a core task impossible, with no workaround.
  For example, a challenge cannot be completed with a keyboard, or a dialog
  traps focus so you cannot leave it.
- **High** — a task is possible but significantly harder, or a workaround
  exists but is hard to discover. For example, a control is operable but has
  no visible focus indicator.
- **Medium** — the experience is degraded but the task is still achievable.
  For example, a heading level is skipped, making navigation less predictable.
- **Low** — a minor rough edge with little impact on completing a task. For
  example, a decorative image is missing an empty `alt` attribute.

### How we respond

This is a volunteer-maintained open source project, so we set expectations we
can keep rather than promise fixed deadlines:

- We aim to acknowledge new accessibility issues within about a week.
- During triage we confirm the problem, assign a severity, and note any
  workaround we know of.
- We prioritize higher-severity barriers first.
- When a fix lands, we'll reference the issue so you can verify it, and we
  welcome your confirmation that the barrier is gone.

If an issue sits without a response, a friendly comment to bump it is always
fine.

## Ownership and maintenance

Accessibility is owned by the project maintainer,
[@d-koppenhagen](https://github.com/d-koppenhagen), together with anyone who
reviews pull requests. Responsibilities include triaging reported barriers,
keeping the automated accessibility checks in place, and reviewing user-facing
changes against the priorities above.

We revisit this page and our accessibility practices periodically, and at
least whenever a significant UI change ships. If maintainership changes, this
section will be updated to name the person or group taking it on.

## Supported environments

We develop and test primarily against current versions of the major
browsers on desktop:

- **Browsers** — recent versions of Chrome, Firefox, Safari, and Edge.
- **Operating systems** — macOS, Windows, and Linux.
- **Input methods** — mouse and full keyboard navigation.

The app is client-side and responsive, so it is intended to work on mobile
browsers as well, though mobile and assistive-technology combinations receive
less systematic testing. We have not formally evaluated every browser and
screen reader pairing, so we avoid implying support for untested combinations.
If you use a setup not listed here and something breaks, please report it —
that feedback helps us widen what we can confidently support.

## Known limitations

We have not completed a formal, independent accessibility audit, so there may
be barriers we are not yet aware of. What we can say is that the UI is built
and tested against the priorities above, with automated axe-core checks in the
test suite and keyboard and screen reader considerations baked into reviews.

We do not currently track specific documented barriers here. As they are
reported and confirmed, we will list them in plain terms — describing the
affected experience, such as "a dialog does not return focus when closed" —
along with any workaround and a link to the tracked issue.

As noted above, this does not include the intentional barriers inside
challenge exercises. Those are part of the learning design, not limitations of
the platform.

## Feedback and improvements

Ideas for improving this statement or our accessibility practices are welcome.
Open an issue or start a discussion on the
[project repository](https://github.com/d-koppenhagen/practica11y). For an
active barrier that is blocking you right now, please use the
[reporting process](#reporting-accessibility-issues) above so we can prioritize
it correctly.
