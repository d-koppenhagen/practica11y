import { TestBed } from '@angular/core/testing';

import { AuthStore } from './auth-store';

const AUTH_STORAGE_KEY = 'practica11y-auth';

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  let callIndex = 0;
  return vi.fn(() => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      json: () => Promise.resolve(resp.body),
    } as Response);
  });
}

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should be created with unauthenticated state', () => {
    expect(store).toBeTruthy();
    expect(store.state()).toBe('unauthenticated');
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.deviceCode()).toBeNull();
    expect(store.error()).toBeNull();
  });

  describe('initialize', () => {
    it('should remain unauthenticated when no stored token exists', async () => {
      await store.initialize();

      expect(store.state()).toBe('unauthenticated');
      expect(store.user()).toBeNull();
    });

    it('should restore authenticated state when stored token is valid', async () => {
      const storedData = {
        token: 'gho_valid_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      globalThis.fetch = mockFetch([
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://example.com/avatar.png',
          },
        },
      ]);

      await store.initialize();

      expect(store.state()).toBe('authenticated');
      expect(store.user()).toEqual({
        login: 'octocat',
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(store.isAuthenticated()).toBe(true);
    });

    it('should clear auth when stored token is invalid (401)', async () => {
      const storedData = {
        token: 'gho_expired_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      globalThis.fetch = mockFetch([
        { status: 401, body: { message: 'Bad credentials' } },
      ]);

      await store.initialize();

      expect(store.state()).toBe('unauthenticated');
      expect(store.user()).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it('should clear auth when stored token is forbidden (403)', async () => {
      const storedData = {
        token: 'gho_forbidden_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      globalThis.fetch = mockFetch([
        { status: 403, body: { message: 'Forbidden' } },
      ]);

      await store.initialize();

      expect(store.state()).toBe('unauthenticated');
      expect(store.user()).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it('should set user signal immediately from cache before validation', async () => {
      const storedData = {
        token: 'gho_token',
        user: {
          login: 'cached_user',
          avatarUrl: 'https://example.com/cached.png',
        },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      let userDuringFetch: unknown = undefined;
      globalThis.fetch = vi.fn(() => {
        userDuringFetch = store.user();
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              login: 'cached_user',
              avatar_url: 'https://example.com/cached.png',
            }),
        } as Response);
      });

      await store.initialize();

      expect(userDuringFetch).toEqual({
        login: 'cached_user',
        avatarUrl: 'https://example.com/cached.png',
      });
    });
  });

  describe('logout', () => {
    it('should clear all auth state and storage', async () => {
      const storedData = {
        token: 'gho_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      globalThis.fetch = mockFetch([
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://example.com/avatar.png',
          },
        },
      ]);

      await store.initialize();
      expect(store.state()).toBe('authenticated');

      store.logout();

      expect(store.state()).toBe('unauthenticated');
      expect(store.user()).toBeNull();
      expect(store.deviceCode()).toBeNull();
      expect(store.error()).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(store.getToken()).toBeNull();
    });

    it('should return the token when stored', () => {
      const storedData = {
        token: 'gho_test_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      expect(store.getToken()).toBe('gho_test_token');
    });
  });

  describe('cancelDeviceFlow', () => {
    it('should reset state to unauthenticated and clear deviceCode', () => {
      // Simulate being in polling state
      store.state.set('polling');
      store.deviceCode.set({
        deviceCode: 'abc',
        userCode: 'ABCD-1234',
        verificationUri: 'https://github.com/login/device',
        expiresIn: 900,
        interval: 5,
      });

      store.cancelDeviceFlow();

      expect(store.state()).toBe('unauthenticated');
      expect(store.deviceCode()).toBeNull();
      expect(store.error()).toBeNull();
    });
  });

  describe('startDeviceFlow', () => {
    it('should set polling state and deviceCode on success', async () => {
      vi.useFakeTimers();

      globalThis.fetch = mockFetch([
        {
          status: 200,
          body: {
            device_code: 'dc_123',
            user_code: 'ABCD-1234',
            verification_uri: 'https://github.com/login/device',
            expires_in: 900,
            interval: 5,
          },
        },
        // Token polling response (immediate success)
        {
          status: 200,
          body: { access_token: 'gho_new_token' },
        },
        // GET /user after token
        {
          status: 200,
          body: { login: 'newuser', avatar_url: 'https://example.com/new.png' },
        },
      ]);

      const promise = store.startDeviceFlow();

      // Let microtasks resolve to process the device code request
      await vi.advanceTimersByTimeAsync(0);

      expect(store.state()).toBe('polling');
      expect(store.deviceCode()).toEqual({
        deviceCode: 'dc_123',
        userCode: 'ABCD-1234',
        verificationUri: 'https://github.com/login/device',
        expiresIn: 900,
        interval: 5,
      });

      // Advance past the polling interval (5 seconds)
      await vi.advanceTimersByTimeAsync(5000);

      // Let all microtasks resolve
      await vi.advanceTimersByTimeAsync(0);

      expect(store.state()).toBe('authenticated');
      expect(store.user()).toEqual({
        login: 'newuser',
        avatarUrl: 'https://example.com/new.png',
      });

      vi.useRealTimers();
    });

    it('should set error when device code request fails', async () => {
      globalThis.fetch = mockFetch([
        { status: 500, body: { message: 'Server error' } },
      ]);

      await store.startDeviceFlow();

      expect(store.state()).toBe('unauthenticated');
      expect(store.error()).toBe('Failed to start device flow');
    });

    it('should set error state when polling times out (expired_token)', async () => {
      vi.useFakeTimers();

      globalThis.fetch = mockFetch([
        {
          status: 200,
          body: {
            device_code: 'dc_timeout',
            user_code: 'TIMEOUT-1234',
            verification_uri: 'https://github.com/login/device',
            expires_in: 900,
            interval: 5,
          },
        },
        // Polling returns expired_token
        {
          status: 200,
          body: {
            error: 'expired_token',
            error_description: 'The device code has expired.',
          },
        },
      ]);

      const promise = store.startDeviceFlow();

      // Let microtasks resolve to process the device code request
      await vi.advanceTimersByTimeAsync(0);

      expect(store.state()).toBe('polling');
      expect(store.deviceCode()).not.toBeNull();

      // Advance past the polling interval to trigger the poll
      await vi.advanceTimersByTimeAsync(5000);
      await vi.advanceTimersByTimeAsync(0);

      expect(store.state()).toBe('unauthenticated');
      expect(store.error()).toBe('Authorization timed out. Please try again.');
      expect(store.deviceCode()).toBeNull();

      vi.useRealTimers();
    });
  });
});
