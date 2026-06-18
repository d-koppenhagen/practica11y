# Sandbox Scripts

This library contains the analysis script that runs inside the preview iframe.
It is bundled as a single IIFE file (`sandbox-analysis.js`) and placed into
`apps/practica11y/public/assets/` at build time.

## Build

```bash
pnpm nx build sandbox-scripts
```

The output is written directly to `apps/practica11y/public/assets/sandbox-analysis.js`.

## How it works

1. When the iframe loads, the script posts a `dom-ready` message to the parent.
2. The parent sends a `run-analysis` message when it wants axe-core to run.
3. The script runs `axe.run(document)` and posts back either `axe-result` or `axe-error`.

Note: `axe-core` (`axe.min.js`) is loaded as a separate `<script>` tag before
this script, making the global `axe` object available.
