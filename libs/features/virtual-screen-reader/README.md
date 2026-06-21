# virtual-screen-reader

Feature library that simulates how a screen reader would announce the content of
the Live Preview. It uses [`@guidepup/virtual-screen-reader`](https://www.guidepup.dev/docs/virtual)
to compute the spoken phrase log for the sandbox document and renders an
accessible player with step, play/pause and speed controls.

## Usage

```html
<a11y-virtual-screen-reader
  [sandboxDocument]="sandboxDocument()"
  [revision]="revision()"
  [(rate)]="rate()"
/>
```

- `sandboxDocument` — the `Document` of the preview iframe to announce.
- `revision` — bump this number to force a re-run of the announcement when the
  document content changes in place (without a reload).
- `rate` — two-way bindable playback rate (0.5–2). Bind it to a persisted value
  to restore the user's preferred speed across sessions.
