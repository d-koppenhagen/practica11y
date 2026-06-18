import { TestBed } from '@angular/core/testing';
import { ProgressStore } from './progress-store';
import { ErrorService } from './error-service';
import { UserProgress, UserSettings } from '@practica11y/types';

describe('ProgressStore', () => {
  let service: ProgressStore;
  let errorService: ErrorService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressStore);
    errorService = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Progress save and load round-trip', () => {
    it('should save and load progress with the same values', async () => {
      await service.initialize();

      const progress: UserProgress = {
        xp: 250,
        completedChallenges: ['challenge-1', 'challenge-2'],
        achievements: [
          {
            id: 'first-challenge',
            title: 'First Steps',
            description: 'Complete your first challenge',
            icon: '🎉',
            unlockedAt: new Date('2024-01-15T10:00:00.000Z'),
          },
        ],
        currentLevel: 'scout',
        lastActivity: new Date('2024-01-15T12:00:00.000Z'),
      };

      await service.saveProgress(progress);
      const loaded = await service.loadProgress();

      expect(loaded.xp).toBe(250);
      expect(loaded.completedChallenges).toEqual([
        'challenge-1',
        'challenge-2',
      ]);
      expect(loaded.achievements).toHaveLength(1);
      expect(loaded.achievements[0].id).toBe('first-challenge');
      expect(loaded.currentLevel).toBe('scout');
      expect(loaded.lastActivity).toBeInstanceOf(Date);
      expect(loaded.lastActivity.toISOString()).toBe(
        '2024-01-15T12:00:00.000Z',
      );
    });
  });

  describe('markChallengeCompleted', () => {
    it('should add completed challenge to progress', async () => {
      await service.initialize();

      await service.markChallengeCompleted('heading-chaos');
      const loaded = await service.loadProgress();

      expect(loaded.completedChallenges).toContain('heading-chaos');
    });

    it('should not create duplicates when marking the same challenge twice', async () => {
      await service.initialize();

      await service.markChallengeCompleted('heading-chaos');
      await service.markChallengeCompleted('heading-chaos');
      const loaded = await service.loadProgress();

      const occurrences = loaded.completedChallenges.filter(
        (id) => id === 'heading-chaos',
      );
      expect(occurrences).toHaveLength(1);
    });

    it('should accumulate multiple different completed challenges', async () => {
      await service.initialize();

      await service.markChallengeCompleted('challenge-a');
      await service.markChallengeCompleted('challenge-b');
      await service.markChallengeCompleted('challenge-c');
      const loaded = await service.loadProgress();

      expect(loaded.completedChallenges).toContain('challenge-a');
      expect(loaded.completedChallenges).toContain('challenge-b');
      expect(loaded.completedChallenges).toContain('challenge-c');
      expect(loaded.completedChallenges).toHaveLength(3);
    });
  });

  describe('Settings save and load round-trip', () => {
    it('should save and load settings with the same values', async () => {
      await service.initialize();

      const settings: UserSettings = {
        editorTheme: 'dark',
        fontSize: 18,
        reducedMotion: true,
      };

      await service.saveSettings(settings);
      const loaded = await service.loadSettings();

      expect(loaded.editorTheme).toBe('dark');
      expect(loaded.fontSize).toBe(18);
      expect(loaded.reducedMotion).toBe(true);
    });
  });

  describe('Storage unavailable - Graceful Degradation', () => {
    let originalIndexedDB: IDBFactory;
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalIndexedDB = globalThis.indexedDB;
      originalLocalStorage = globalThis.localStorage;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: originalIndexedDB,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });

    it('should report storage as unavailable when both indexedDB and localStorage are missing', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage not available');
        },
        configurable: true,
      });

      // Create a fresh instance with storage disabled
      const freshService = TestBed.inject(ProgressStore);
      await freshService.initialize();

      expect(freshService.isStorageAvailable()).toBe(false);
    });

    it('should still save and load progress using in-memory fallback without throwing', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage not available');
        },
        configurable: true,
      });

      const freshService = TestBed.inject(ProgressStore);
      await freshService.initialize();

      const progress: UserProgress = {
        xp: 100,
        completedChallenges: ['test-challenge'],
        achievements: [],
        currentLevel: 'hatchling',
        lastActivity: new Date('2024-06-01T08:00:00.000Z'),
      };

      // Should not throw
      await freshService.saveProgress(progress);
      const loaded = await freshService.loadProgress();

      expect(loaded.xp).toBe(100);
      expect(loaded.completedChallenges).toEqual(['test-challenge']);
    });

    it('should still save and load settings using in-memory fallback without throwing', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage not available');
        },
        configurable: true,
      });

      const freshService = TestBed.inject(ProgressStore);
      await freshService.initialize();

      const settings: UserSettings = {
        editorTheme: 'dark',
        fontSize: 16,
        reducedMotion: false,
      };

      // Should not throw
      await freshService.saveSettings(settings);
      const loaded = await freshService.loadSettings();

      expect(loaded.editorTheme).toBe('dark');
      expect(loaded.fontSize).toBe(16);
    });

    it('should report a storage error when storage is unavailable', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('localStorage not available');
        },
        configurable: true,
      });

      const freshService = TestBed.inject(ProgressStore);
      await freshService.initialize();

      const errors = errorService.errors();
      const storageError = errors.find((e) => e.id === 'storage-unavailable');
      expect(storageError).toBeDefined();
      expect(storageError!.category).toBe('storage');
      expect(storageError!.recoverable).toBe(true);
    });
  });
});
