# GitHub Auth Proxy

Cloudflare Worker that proxies GitHub OAuth Device Flow requests with CORS headers.

See [`docs/github-auth-proxy.md`](../../docs/github-auth-proxy.md) for full documentation.

## Quick Start

```bash
pnpm install
pnpm dev     # local worker at http://localhost:8787
pnpm deploy  # deploy to Cloudflare (requires env vars)
```
