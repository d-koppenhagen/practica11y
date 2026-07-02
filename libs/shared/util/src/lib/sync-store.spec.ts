import { TestBed } from '@angular/core/testing';

import { UserProgress, UserSettings } from '@practica11y/types';

import { AuthStore } from './auth-store';
import { ErrorService } from './error-service';
import { Gamification } from './gamification';
import { ProgressStore } from './progress-store';
import { SyncStore } from './sync-store';

const AUTH_STORAGE_KEY = 'practica11y-auth';

function createMockProgress(
  overrides: Partial<UserProgress> = {},
): UserProgress {
  return {
    xp: 100,
    completedChallenges: ['aria-labels'],
    peekedChallenges: ['color-contrast'],
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

function createMockSettings(
  overrides: Partial<UserSettings> = {},
): UserSettings {
  return {
    editorTheme: 'dark',
    fontSize: 16,
    reducedMotion: false,
    ...overrides,
  };
}

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

describe('SyncStore', () => {
  let store: SyncStore;
  let authStore: AuthStore;
  let progressStore: ProgressStore;
  let gamification: Gamification;
  let errorService: ErrorService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(SyncStore);
    authStore = TestBed.inject(AuthStore);
    progressStore = TestBed.inject(ProgressStore);
    gamification = TestBed.inject(Gamification);
    errorService = TestBed.inject(ErrorService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('resolveConflict', () => {
    it('should return "push" when local is newer than remote', () => {
      const local = new Date('2024-01-20T14:00:00.000Z');
      const remote = new Date('2024-01-19T10:00:00.000Z');

      expect(store.resolveConflict(local, remote)).toBe('push');
    });

    it('should return "pull" when remote is newer than local', () => {
      const local = new Date('2024-01-19T10:00:00.000Z');
      const remote = new Date('2024-01-20T14:00:00.000Z');

      expect(store.resolveConflict(local, remote)).toBe('pull');
    });

    it('should return "none" when timestamps are equal', () => {
      const timestamp = new Date('2024-01-20T14:00:00.000Z');

      expect(
        store.resolveConflict(timestamp, new Date(timestamp.getTime())),
      ).toBe('none');
    });
  });

  describe('serialize / deserialize', () => {
    it('should round-trip preserve UserProgress and UserSettings', () => {
      const progress = createMockProgress();
      const settings = createMockSettings();

      const payload = store.serialize(progress, settings);
      const result = store.deserialize(payload);

      expect(result.progress.xp).toBe(progress.xp);
      expect(result.progress.completedChallenges).toEqual(
        progress.completedChallenges,
      );
      expect(result.progress.peekedChallenges).toEqual(
        progress.peekedChallenges,
      );
      expect(result.progress.currentLevel).toBe(progress.currentLevel);
      expect(result.progress.lastActivity).toEqual(progress.lastActivity);
      expect(result.progress.lastActivity).toBeInstanceOf(Date);
      expect(result.settings).toEqual(settings);
    });

    it('should restore achievement dates correctly from ISO strings', () => {
      const progress = createMockProgress({
        achievements: [
          {
            id: 'test',
            title: 'Test',
            description: 'Test achievement',
            icon: '🏆',
            unlockedAt: new Date('2024-03-10T08:15:00.000Z'),
          },
        ],
      });
      const settings = createMockSettings();

      const payload = store.serialize(progress, settings);
      const result = store.deserialize(payload);

      expect(result.progress.achievements[0].unlockedAt).toBeInstanceOf(Date);
      expect(result.progress.achievements[0].unlockedAt).toEqual(
        new Date('2024-03-10T08:15:00.000Z'),
      );
    });

    it('should handle achievements without unlockedAt', () => {
      const progress = createMockProgress({
        achievements: [
          {
            id: 'no-date',
            title: 'No Date',
            description: 'Achievement without date',
            icon: '✨',
          },
        ],
      });
      const settings = createMockSettings();

      const payload = store.serialize(progress, settings);
      const result = store.deserialize(payload);

      expect(result.progress.achievements[0].unlockedAt).toBeUndefined();
    });
  });

  describe('findSyncGist', () => {
    it('should return the gist ID when practica11y-sync.json exists', () => {
      const gists = [
        { id: 'gist-1', files: { 'other-file.txt': {} } },
        { id: 'gist-2', files: { 'practica11y-sync.json': {} } },
        { id: 'gist-3', files: { 'readme.md': {} } },
      ];

      expect(store.findSyncGist(gists)).toBe('gist-2');
    });

    it('should return null when no matching gist exists', () => {
      const gists = [
        { id: 'gist-1', files: { 'other-file.txt': {} } },
        { id: 'gist-3', files: { 'readme.md': {} } },
      ];

      expect(store.findSyncGist(gists)).toBeNull();
    });

    it('should return null for an empty gist list', () => {
      expect(store.findSyncGist([])).toBeNull();
    });
  });

  describe('sync — concurrency guard', () => {
    it('should ignore a second sync() call while the first is in progress', async () => {
      // Set up auth token
      const storedData = {
        token: 'gho_test_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      // Create a fetch that never resolves (simulating in-progress request)
      let resolveFirst!: (value: Response) => void;
      const neverResolvingPromise = new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      });

      const fetchMock = vi.fn().mockReturnValue(neverResolvingPromise);
      globalThis.fetch = fetchMock;

      // Start first sync (won't complete)
      const firstSync = store.sync();

      // Start second sync while first is in progress
      await store.sync();

      // Only one fetch call should have been made (from the first sync)
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Clean up: resolve the pending promise to avoid unhandled rejection
      resolveFirst({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as Response);
      await firstSync;
    });
  });

  describe('sync — network error', () => {
    it('should set state to "error" and preserve local data on network failure', async () => {
      // Set up auth token
      const storedData = {
        token: 'gho_test_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      // Set up local progress
      const localProgress = createMockProgress();
      vi.spyOn(progressStore, 'loadProgress').mockResolvedValue(localProgress);
      vi.spyOn(progressStore, 'loadSettings').mockResolvedValue(
        createMockSettings(),
      );
      const saveSpy = vi.spyOn(progressStore, 'saveProgress');

      // Mock fetch to reject with a network error
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await store.sync();

      expect(store.state()).toBe('error');
      expect(store.lastError()).toBe('Network error');
      // Local data should not be overwritten
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('sync — auth error (401)', () => {
    it('should trigger logout when API returns 401', async () => {
      // Set up auth token
      const storedData = {
        token: 'gho_expired_token',
        user: { login: 'octocat', avatarUrl: 'https://example.com/avatar.png' },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedData));

      const logoutSpy = vi.spyOn(authStore, 'logout');

      // Mock fetch to return 401
      globalThis.fetch = mockFetch([
        { status: 401, body: { message: 'Bad credentials' } },
      ]);

      await store.sync();

      expect(logoutSpy).toHaveBeenCalled();
      expect(store.state()).toBe('error');
      expect(store.lastError()).toContain('Authentication failed');
    });
  });
});
