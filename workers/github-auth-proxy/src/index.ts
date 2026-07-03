/**
 * GitHub Auth Proxy — Cloudflare Worker
 *
 * Proxies OAuth Device Flow requests to GitHub's endpoints that do not support
 * browser-side CORS. This worker adds the necessary CORS headers so the
 * Practica11y client can call the Device Flow from any origin.
 *
 * Allowed endpoints:
 *   POST /login/device/code       → https://github.com/login/device/code
 *   POST /login/oauth/access_token → https://github.com/login/oauth/access_token
 */

const ALLOWED_ORIGINS = [
  'https://practica11y.dev',
  'https://www.practica11y.dev',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];

const GITHUB_ENDPOINTS: Record<string, string> = {
  '/login/device/code': 'https://github.com/login/device/code',
  '/login/oauth/access_token': 'https://github.com/login/oauth/access_token',
};

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only POST is allowed
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const targetUrl = GITHUB_ENDPOINTS[url.pathname];

    if (!targetUrl) {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Forward the request to GitHub
    const githubResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type':
          request.headers.get('Content-Type') ??
          'application/x-www-form-urlencoded',
        Accept: request.headers.get('Accept') ?? 'application/json',
      },
      body: request.body,
    });

    // Return GitHub's response with CORS headers
    const responseHeaders = new Headers(githubResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    return new Response(githubResponse.body, {
      status: githubResponse.status,
      headers: responseHeaders,
    });
  },
};
