export const environment = {
  production: false,
  github: {
    // Public OAuth Client ID (no secret needed for Device Flow)
    clientId: 'Ov23liN6ftkh3by5wS0Z',
    deviceCodeUrl: '/github-auth/login/device/code',
    tokenUrl: '/github-auth/login/oauth/access_token',
    apiBase: 'https://api.github.com',
  },
};
