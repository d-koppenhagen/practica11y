# GitHub Auth Proxy (Cloudflare Worker)

## Why This Exists

GitHub's OAuth Device Flow endpoints (`github.com/login/device/code` and `github.com/login/oauth/access_token`) do **not** support CORS. Browsers block cross-origin POST requests to these URLs.

Previously, the Angular dev server proxied these requests during local development (via `proxy.conf.json`), but production on GitHub Pages had no equivalent — resulting in `405 Method Not Allowed` errors.

The solution is a lightweight Cloudflare Worker that:

1. Receives POST requests from the Practica11y client
2. Forwards them to GitHub's OAuth endpoints server-side
3. Returns the response with proper CORS headers

This worker is used by **both** local development and production, ensuring a single code path and reproducible behavior across environments.

## Architecture

```text
┌─────────────────┐       POST /login/device/code       ┌─────────────────────────────────────┐
│  Practica11y    │ ──────────────────────────────────── │  Cloudflare Worker                  │
│  (Browser)      │                                      │  github-auth-proxy.practica11y.     │
│                 │ ◄──── JSON response + CORS headers ─ │  workers.dev                        │
└─────────────────┘                                      └───────────────┬─────────────────────┘
                                                                         │
                                                                         │ POST (server-side, no CORS)
                                                                         ▼
                                                         ┌───────────────────────────────────────┐
                                                         │  github.com/login/device/code         │
                                                         │  github.com/login/oauth/access_token  │
                                                         └───────────────────────────────────────┘
```

## Endpoints

| Worker Path                      | Proxied To                                    |
| -------------------------------- | --------------------------------------------- |
| `POST /login/device/code`        | `https://github.com/login/device/code`        |
| `POST /login/oauth/access_token` | `https://github.com/login/oauth/access_token` |

## Allowed Origins

The worker only allows requests from:

- `https://practica11y.dev`
- `https://www.practica11y.dev`
- `http://localhost:4200`
- `http://127.0.0.1:4200`

All other origins are rejected.

## Local Development

The auth-store points directly to the deployed worker URL. No local proxy configuration is needed. If the worker is deployed and running, local development works identically to production.

To run the worker locally during development (optional, only needed when modifying the worker itself):

```bash
cd workers/github-auth-proxy
pnpm install
pnpm dev
```

This starts the worker on `http://localhost:8787`. You can temporarily update the `GITHUB_CONFIG` URLs in `auth-store.ts` to point there for testing worker changes.

## Deployment

### Automatic (CI)

The worker is deployed automatically via GitHub Actions (`.github/workflows/deploy-worker.yml`) when changes are pushed to `main` in the `workers/github-auth-proxy/` directory.

### Manual (from local machine)

1. Copy the example env file and fill in your credentials:

   ```bash
   cp workers/github-auth-proxy/.env.example workers/github-auth-proxy/.env
   ```

2. Edit `.env` with your Cloudflare Account ID and API Token

3. Deploy:
   ```bash
   cd workers/github-auth-proxy
   pnpm install
   pnpm deploy
   ```

Wrangler automatically reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the `.env` file. The `.env` file is gitignored — never commit it.

## Setup (One-Time)

1. **Create a Cloudflare account** at [cloudflare.com](https://dash.cloudflare.com/sign-up) (free tier is sufficient)

2. **Get your Account ID** from the Cloudflare dashboard (right sidebar on the Workers & Pages overview)

3. **Create an API token** with the `Workers Scripts: Edit` permission:
   - Go to: My Profile → API Tokens → Create Token
   - Use the "Edit Cloudflare Workers" template
   - Scope it to your account

4. **Add GitHub repository secrets:**
   - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID
   - `CLOUDFLARE_API_TOKEN` — the API token from step 3

5. **First deploy** — run manually once or push a change to `workers/github-auth-proxy/`:

   ```bash
   cd workers/github-auth-proxy
   pnpm install
   CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> pnpm deploy
   ```

6. **Verify** — the worker should be live at `https://github-auth-proxy.<your-subdomain>.workers.dev`

7. **Update environment URLs** — if your worker subdomain differs from `practica11y`, update the URLs in:
   - `apps/practica11y/src/environments/environment.ts`
   - `apps/practica11y/src/environments/environment.prod.ts`

## Custom Domain (Optional)

To use a subdomain like `auth-proxy.practica11y.dev`:

1. Add your domain to Cloudflare (DNS must be managed by Cloudflare)
2. Uncomment the `routes` line in `workers/github-auth-proxy/wrangler.toml`
3. Redeploy

## Security Considerations

- The worker only proxies two specific GitHub endpoints — no open proxy
- Origin checking restricts which sites can use the worker
- No secrets are stored in the worker — the GitHub Client ID is public (Device Flow does not use a client secret)
- Rate limiting is handled by GitHub itself (Device Flow has built-in `interval` and `slow_down` responses)
