import { computed, Injectable, signal } from '@angular/core';

import {
  AuthState,
  DeviceCodeResponse,
  GitHubUser,
  StoredAuthData,
} from '@practica11y/types';

const AUTH_STORAGE_KEY = 'practica11y-auth';

const GITHUB_CONFIG = {
  // Public OAuth Client ID (no secret needed for Device Flow — safe to commit)
  clientId: 'Ov23liN6ftkh3by5wS0Z',
  deviceCodeUrl: '/github-auth/login/device/code',
  tokenUrl: '/github-auth/login/oauth/access_token',
  apiBase: 'https://api.github.com',
} as const;

const MAX_POLL_RETRIES = 3;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly state = signal<AuthState>('unauthenticated');
  readonly user = signal<GitHubUser | null>(null);
  readonly isAuthenticated = computed(() => this.state() === 'authenticated');
  readonly deviceCode = signal<DeviceCodeResponse | null>(null);
  readonly error = signal<string | null>(null);

  private pollAborted = false;
  private polling = false;

  async initialize(): Promise<void> {
    const stored = this.getStoredAuth();
    if (!stored) {
      return;
    }

    // Immediately set user for instant UI rendering
    this.user.set(stored.user);

    try {
      const response = await fetch(`${GITHUB_CONFIG.apiBase}/user`, {
        headers: {
          Authorization: `Bearer ${stored.token}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        this.clearStoredAuth();
        this.user.set(null);
        this.state.set('unauthenticated');
        return;
      }

      if (!response.ok) {
        this.clearStoredAuth();
        this.user.set(null);
        this.state.set('unauthenticated');
        return;
      }

      const userData = await response.json();
      const validUser: GitHubUser = {
        login: userData.login,
        avatarUrl: userData.avatar_url,
      };

      // Update stored data with fresh user info
      this.storeAuth(stored.token, validUser);
      this.user.set(validUser);
      this.state.set('authenticated');
    } catch {
      this.clearStoredAuth();
      this.user.set(null);
      this.state.set('unauthenticated');
    }
  }

  async startDeviceFlow(): Promise<void> {
    this.error.set(null);
    this.state.set('polling');

    try {
      const response = await fetch(GITHUB_CONFIG.deviceCodeUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: GITHUB_CONFIG.clientId,
          scope: 'gist',
        }),
      });

      if (!response.ok) {
        this.error.set('Failed to start device flow');
        this.state.set('unauthenticated');
        return;
      }

      const data = await response.json();
      const deviceCodeResponse: DeviceCodeResponse = {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresIn: data.expires_in,
        interval: data.interval,
      };

      this.deviceCode.set(deviceCodeResponse);
      this.pollAborted = false;
      this.pollForToken(deviceCodeResponse);
    } catch {
      this.error.set('Failed to start device flow');
      this.state.set('unauthenticated');
    }
  }

  cancelDeviceFlow(): void {
    this.pollAborted = true;
    this.polling = false;
    this.deviceCode.set(null);
    this.error.set(null);
    this.state.set('unauthenticated');
  }

  logout(): void {
    this.clearStoredAuth();
    this.user.set(null);
    this.deviceCode.set(null);
    this.error.set(null);
    this.state.set('unauthenticated');
  }

  getToken(): string | null {
    const stored = this.getStoredAuth();
    return stored?.token ?? null;
  }

  private async pollForToken(
    deviceCodeResponse: DeviceCodeResponse,
  ): Promise<void> {
    if (this.polling) {
      return;
    }
    this.polling = true;

    const baseInterval = deviceCodeResponse.interval * 1000;
    let rateLimitRetries = 0;

    const expiresAt = Date.now() + deviceCodeResponse.expiresIn * 1000;

    while (!this.pollAborted && Date.now() < expiresAt) {
      const interval = baseInterval * Math.pow(2, rateLimitRetries);
      await this.delay(interval);

      if (this.pollAborted) {
        break;
      }

      try {
        const response = await fetch(GITHUB_CONFIG.tokenUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            client_id: GITHUB_CONFIG.clientId,
            device_code: deviceCodeResponse.deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          await this.handleTokenSuccess(data.access_token);
          this.polling = false;
          return;
        }

        if (data.error === 'authorization_pending') {
          // User hasn't authorized yet, continue polling
          continue;
        }

        if (data.error === 'slow_down') {
          rateLimitRetries++;
          if (rateLimitRetries > MAX_POLL_RETRIES) {
            this.error.set('Rate limited by GitHub. Please try again later.');
            this.state.set('unauthenticated');
            this.deviceCode.set(null);
            this.polling = false;
            return;
          }
          continue;
        }

        if (data.error === 'expired_token') {
          this.error.set('Authorization timed out. Please try again.');
          this.state.set('unauthenticated');
          this.deviceCode.set(null);
          this.polling = false;
          return;
        }

        if (data.error === 'access_denied') {
          this.error.set('Authorization was denied.');
          this.state.set('unauthenticated');
          this.deviceCode.set(null);
          this.polling = false;
          return;
        }

        // Unknown error
        this.error.set(data.error_description || 'Authentication failed');
        this.state.set('unauthenticated');
        this.deviceCode.set(null);
        this.polling = false;
        return;
      } catch {
        rateLimitRetries++;
        if (rateLimitRetries > MAX_POLL_RETRIES) {
          this.error.set(
            'Network error during authentication. Please try again.',
          );
          this.state.set('unauthenticated');
          this.deviceCode.set(null);
          this.polling = false;
          return;
        }
        // Network error, retry with backoff
        continue;
      }
    }

    // If we exited the loop due to expiry
    if (!this.pollAborted && Date.now() >= expiresAt) {
      this.error.set('Authorization timed out. Please try again.');
      this.state.set('unauthenticated');
      this.deviceCode.set(null);
    }

    this.polling = false;
  }

  private async handleTokenSuccess(token: string): Promise<void> {
    try {
      const response = await fetch(`${GITHUB_CONFIG.apiBase}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.error.set('Failed to fetch user profile');
        this.state.set('unauthenticated');
        return;
      }

      const userData = await response.json();
      const githubUser: GitHubUser = {
        login: userData.login,
        avatarUrl: userData.avatar_url,
      };

      this.storeAuth(token, githubUser);
      this.user.set(githubUser);
      this.deviceCode.set(null);
      this.state.set('authenticated');
    } catch {
      this.error.set('Failed to fetch user profile');
      this.state.set('unauthenticated');
    }
  }

  private storeAuth(token: string, user: GitHubUser): void {
    const data: StoredAuthData = { token, user };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }

  private getStoredAuth(): StoredAuthData | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as StoredAuthData;
    } catch {
      return null;
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
