import { TestBed } from '@angular/core/testing';

import { SyncPayload, UserProgress, UserSettings } from '@practica11y/types';

import { AuthStore } from './auth-store';
import { ErrorService } from './error-service';
import { Gamification } from './gamification';
import { ProgressStore } from './progress-store';
import { SyncStore } from './sync-store';

const AUTH_STORAGE_KEY = 'practica11y-auth';
const GIST_FILENAME = 'practica11y-sync.json';

function createProgress(overrides: Partial<UserProgress> = {}): UserProgress {
  return {
    xp: 100,
    completedChallenges: ['aria-labels'],
    peekedChallenges: [],
    achievements: [
      {
        id: 'first-challenge',
        title: 'First Steps',
        description: 'Completed your first challenge',
        icon: '🎯',
        unlockedAt: new Date('2024-01-15T10:30:00.000Z'),
      },
    ],
    currentLevel: 'scout',
    lastActivity: new Date('2024-01-20T14:22:00.000Z'),
    ...overrides,
  };
}

function createSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    editorTheme: 'dark',
    fontSize: 16,
    reducedMotion: false,
    ...overrides,
  };
}

function createSyncPayload(
  progress: UserProgress,
  settings: UserSettings,
): SyncPayload {
  return {
    version: 1,
    progress: {
      xp: progress.xp,
      completedChallenges: progress.completedChallenges,
      peekedChallenges: progress.peekedChallenges,
      achievements: progress.achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt?.toISOString(),
      })),
      currentLevel: progress.currentLevel,
      lastActivity: progress.lastActivity.toISOString(),
    },
    settings,
  };
}

interface FetchResponse {
  status: number;
  body: unknown;
  method?: string;
  url?: string;
}

function mockFetchSequence(responses: FetchResponse[]) {
  let callIndex = 0;
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      json: () => Promise.resolve(resp.body),
    } as Response);
  });

  return { fn, calls };
}

function storeValidToken(): void {
  const storedData = {
    token: 'gho_valid_token',
    user: {
      login: 'octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));
}

describe('Sync Integration', () => {
  let authStore: AuthStore;
  let syncStore: SyncStore;
  let progressStore: ProgressStore;
  let gamification: Gamification;
  let errorService: ErrorService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    authStore = TestBed.inject(AuthStore);
    syncStore = TestBed.inject(SyncStore);
    progressStore = TestBed.inject(ProgressStore);
    gamification = TestBed.inject(Gamification);
    errorService = TestBed.inject(ErrorService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('App initialization with valid token triggers sync', () => {
    it('should authenticate and allow sync after initialize succeeds', async () => {
      storeValidToken();

      const localProgress = createProgress();
      const localSettings = createSettings();

      vi.spyOn(progressStore, 'loadProgress').mockResolvedValue(localProgress);
      vi.spyOn(progressStore, 'loadSettings').mockResolvedValue(localSettings);

      const { fn: fetchMock, calls } = mockFetchSequence([
        // 1. GET /user (auth validation during initialize)
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
        // 2. GET /gists (sync: list gists)
        {
          status: 200,
          body: [],
        },
        // 3. POST /gists (sync: create new gist since none exists)
        {
          status: 201,
          body: { id: 'new-gist-id' },
        },
      ]);
      globalThis.fetch = fetchMock;

      // Initialize auth — validates stored token
      await authStore.initialize();
      expect(authStore.state()).toBe('authenticated');

      // Simulate the effect that the App triggers: sync on authentication
      await syncStore.sync();

      expect(syncStore.state()).toBe('success');

      // Verify the gist API was called
      expect(calls.length).toBe(3);
      expect(calls[0].url).toContain('/user');
      expect(calls[1].url).toContain('/gists');
      expect(calls[2].url).toContain('/gists');
      expect(calls[2].init?.method).toBe('POST');
    });
  });

  describe('Challenge completion triggers sync', () => {
    it('should sync after a challenge is completed', async () => {
      storeValidToken();

      const localProgress = createProgress({
        completedChallenges: ['aria-labels', 'focus-management'],
        lastActivity: new Date('2024-02-01T10:00:00.000Z'),
      });
      const localSettings = createSettings();

      vi.spyOn(progressStore, 'loadProgress').mockResolvedValue(localProgress);
      vi.spyOn(progressStore, 'loadSettings').mockResolvedValue(localSettings);

      const remotePayload = createSyncPayload(
        createProgress({
          completedChallenges: ['aria-labels'],
          lastActivity: new Date('2024-01-20T14:22:00.000Z'),
        }),
        createSettings(),
      );

      const { fn: fetchMock, calls } = mockFetchSequence([
        // 1. GET /user (auth validation)
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
        // 2. GET /gists (list gists)
        {
          status: 200,
          body: [{ id: 'existing-gist-id', files: { [GIST_FILENAME]: {} } }],
        },
        // 3. GET /gists/existing-gist-id (read gist)
        {
          status: 200,
          body: {
            files: {
              [GIST_FILENAME]: { content: JSON.stringify(remotePayload) },
            },
          },
        },
        // 4. PATCH /gists/existing-gist-id (push — local is newer)
        {
          status: 200,
          body: { id: 'existing-gist-id' },
        },
      ]);
      globalThis.fetch = fetchMock;

      await authStore.initialize();
      expect(authStore.state()).toBe('authenticated');

      // Simulate challenge completion triggering sync
      await syncStore.sync();

      expect(syncStore.state()).toBe('success');

      // Should push because local lastActivity (2024-02-01) > remote (2024-01-20)
      expect(calls.length).toBe(4);
      expect(calls[3].url).toContain('/gists/existing-gist-id');
      expect(calls[3].init?.method).toBe('PATCH');

      // Verify the pushed body contains the updated challenge list
      const patchBody = JSON.parse(calls[3].init?.body as string);
      const pushedPayload: SyncPayload = JSON.parse(
        patchBody.files[GIST_FILENAME].content,
      );
      expect(pushedPayload.progress.completedChallenges).toContain(
        'focus-management',
      );
    });
  });

  describe('Pull scenario (remote newer)', () => {
    it('should update local ProgressStore and Gamification when remote is newer', async () => {
      storeValidToken();

      const localProgress = createProgress({
        xp: 100,
        completedChallenges: ['aria-labels'],
        lastActivity: new Date('2024-01-10T08:00:00.000Z'),
      });
      const localSettings = createSettings();

      const remoteProgress = createProgress({
        xp: 500,
        completedChallenges: [
          'aria-labels',
          'focus-management',
          'color-contrast',
        ],
        achievements: [
          {
            id: 'first-challenge',
            title: 'First Steps',
            description: 'Completed your first challenge',
            icon: '🎯',
            unlockedAt: new Date('2024-01-15T10:30:00.000Z'),
          },
          {
            id: 'ten-challenges',
            title: 'Getting Serious',
            description: 'Completed 10 challenges',
            icon: '🔥',
            unlockedAt: new Date('2024-02-01T12:00:00.000Z'),
          },
        ],
        currentLevel: 'scout',
        lastActivity: new Date('2024-02-01T12:00:00.000Z'),
      });
      const remoteSettings = createSettings({
        editorTheme: 'light',
        fontSize: 18,
      });
      const remotePayload = createSyncPayload(remoteProgress, remoteSettings);

      vi.spyOn(progressStore, 'loadProgress').mockResolvedValue(localProgress);
      vi.spyOn(progressStore, 'loadSettings').mockResolvedValue(localSettings);
      const overwriteProgressSpy = vi
        .spyOn(progressStore, 'overwriteProgress')
        .mockResolvedValue(undefined);
      const overwriteSettingsSpy = vi
        .spyOn(progressStore, 'overwriteSettings')
        .mockResolvedValue(undefined);

      const { fn: fetchMock } = mockFetchSequence([
        // 1. GET /user (auth validation)
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
        // 2. GET /gists (list gists)
        {
          status: 200,
          body: [{ id: 'sync-gist-123', files: { [GIST_FILENAME]: {} } }],
        },
        // 3. GET /gists/sync-gist-123 (read gist content)
        {
          status: 200,
          body: {
            files: {
              [GIST_FILENAME]: { content: JSON.stringify(remotePayload) },
            },
          },
        },
      ]);
      globalThis.fetch = fetchMock;

      await authStore.initialize();
      expect(authStore.state()).toBe('authenticated');

      await syncStore.sync();

      expect(syncStore.state()).toBe('success');

      // Verify local progress was overwritten with remote data
      expect(overwriteProgressSpy).toHaveBeenCalledTimes(1);
      const pulledProgress = overwriteProgressSpy.mock.calls[0][0];
      expect(pulledProgress.xp).toBe(500);
      expect(pulledProgress.completedChallenges).toEqual([
        'aria-labels',
        'focus-management',
        'color-contrast',
      ]);
      expect(pulledProgress.lastActivity).toEqual(
        new Date('2024-02-01T12:00:00.000Z'),
      );
      expect(pulledProgress.achievements).toHaveLength(2);
      expect(pulledProgress.achievements[1].id).toBe('ten-challenges');

      // Verify settings were overwritten
      expect(overwriteSettingsSpy).toHaveBeenCalledTimes(1);
      const pulledSettings = overwriteSettingsSpy.mock.calls[0][0];
      expect(pulledSettings.editorTheme).toBe('light');
      expect(pulledSettings.fontSize).toBe(18);

      // Verify gamification signals were updated
      expect(gamification.currentXP()).toBe(500);
      expect(gamification.achievements()).toHaveLength(2);
    });
  });

  describe('Push scenario (local newer)', () => {
    it('should write local data to mocked Gist API when local is newer', async () => {
      storeValidToken();

      const localProgress = createProgress({
        xp: 300,
        completedChallenges: ['aria-labels', 'focus-management'],
        lastActivity: new Date('2024-02-15T16:00:00.000Z'),
      });
      const localSettings = createSettings({ fontSize: 20 });

      const remoteProgress = createProgress({
        xp: 100,
        completedChallenges: ['aria-labels'],
        lastActivity: new Date('2024-01-20T14:22:00.000Z'),
      });
      const remotePayload = createSyncPayload(remoteProgress, createSettings());

      vi.spyOn(progressStore, 'loadProgress').mockResolvedValue(localProgress);
      vi.spyOn(progressStore, 'loadSettings').mockResolvedValue(localSettings);
      const overwriteProgressSpy = vi.spyOn(progressStore, 'overwriteProgress');

      const { fn: fetchMock, calls } = mockFetchSequence([
        // 1. GET /user (auth validation)
        {
          status: 200,
          body: {
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        },
        // 2. GET /gists (list gists)
        {
          status: 200,
          body: [{ id: 'gist-push-test', files: { [GIST_FILENAME]: {} } }],
        },
        // 3. GET /gists/gist-push-test (read remote gist)
        {
          status: 200,
          body: {
            files: {
              [GIST_FILENAME]: { content: JSON.stringify(remotePayload) },
            },
          },
        },
        // 4. PATCH /gists/gist-push-test (push local data)
        {
          status: 200,
          body: { id: 'gist-push-test' },
        },
      ]);
      globalThis.fetch = fetchMock;

      await authStore.initialize();
      expect(authStore.state()).toBe('authenticated');

      await syncStore.sync();

      expect(syncStore.state()).toBe('success');

      // Verify PATCH was called to push local data
      expect(calls.length).toBe(4);
      const patchCall = calls[3];
      expect(patchCall.url).toContain('/gists/gist-push-test');
      expect(patchCall.init?.method).toBe('PATCH');

      // Verify the pushed payload contains local data
      const patchBody = JSON.parse(patchCall.init?.body as string);
      const pushedPayload: SyncPayload = JSON.parse(
        patchBody.files[GIST_FILENAME].content,
      );
      expect(pushedPayload.progress.xp).toBe(300);
      expect(pushedPayload.progress.completedChallenges).toEqual([
        'aria-labels',
        'focus-management',
      ]);
      expect(pushedPayload.progress.lastActivity).toBe(
        '2024-02-15T16:00:00.000Z',
      );
      expect(pushedPayload.settings.fontSize).toBe(20);

      // Verify local progress was NOT overwritten (push means we keep local)
      expect(overwriteProgressSpy).not.toHaveBeenCalled();
    });
  });
});
