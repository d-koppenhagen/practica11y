import { inject, Injectable } from '@angular/core';

import { UserProgress, UserSettings } from '@practica11y/types';

import { ErrorService } from './error-service';

const DB_NAME = 'practica11y-db';
const DB_VERSION = 1;
const PROGRESS_STORE = 'progress';
const SETTINGS_STORE = 'settings';
const PROGRESS_KEY = 'user-progress';
const SETTINGS_KEY = 'user-settings';

const LS_PROGRESS_KEY = 'practica11y-progress';
const LS_SETTINGS_KEY = 'practica11y-settings';

function getDefaultProgress(): UserProgress {
  return {
    xp: 0,
    completedChallenges: [],
    peekedChallenges: [],
    achievements: [],
    currentLevel: 'hatchling',
    lastActivity: new Date(),
  };
}

function getDefaultSettings(): UserSettings {
  return {
    editorTheme: 'light',
    fontSize: 14,
    reducedMotion: false,
  };
}

@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly errorService = inject(ErrorService);
  private db: IDBDatabase | null = null;
  private storageAvailable = false;
  private useIndexedDB = false;
  private inMemoryProgress: UserProgress = getDefaultProgress();
  private inMemorySettings: UserSettings = getDefaultSettings();

  async initialize(): Promise<void> {
    if (this.tryIndexedDB()) {
      try {
        this.db = await this.openDatabase();
        this.useIndexedDB = true;
        this.storageAvailable = true;
        return;
      } catch {
        // IndexedDB failed, try localStorage
      }
    }

    if (this.tryLocalStorage()) {
      this.useIndexedDB = false;
      this.storageAvailable = true;
      return;
    }

    this.storageAvailable = false;
    this.errorService.addError({
      id: 'storage-unavailable',
      category: 'storage',
      message:
        'Local storage is not available. Your progress will only be saved for this session.',
      recoverable: true,
      timestamp: new Date(),
    });
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    this.inMemoryProgress = progress;

    if (!this.storageAvailable) {
      return;
    }

    try {
      if (this.useIndexedDB && this.db) {
        await this.idbPut(PROGRESS_STORE, PROGRESS_KEY, progress);
      } else {
        localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(progress));
      }
    } catch {
      this.reportStorageError('Failed to save progress.');
    }
  }

  async loadProgress(): Promise<UserProgress> {
    if (!this.storageAvailable) {
      return this.inMemoryProgress;
    }

    try {
      if (this.useIndexedDB && this.db) {
        const stored = await this.idbGet<UserProgress>(
          PROGRESS_STORE,
          PROGRESS_KEY,
        );
        if (stored) {
          stored.lastActivity = new Date(stored.lastActivity);
          stored.peekedChallenges = stored.peekedChallenges ?? [];
          this.inMemoryProgress = stored;
          return stored;
        }
      } else {
        const raw = localStorage.getItem(LS_PROGRESS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as UserProgress;
          parsed.lastActivity = new Date(parsed.lastActivity);
          parsed.peekedChallenges = parsed.peekedChallenges ?? [];
          this.inMemoryProgress = parsed;
          return parsed;
        }
      }
    } catch {
      this.reportStorageError('Failed to load progress.');
    }

    return this.inMemoryProgress;
  }

  async markChallengeCompleted(challengeId: string): Promise<void> {
    const progress = await this.loadProgress();

    if (!progress.completedChallenges.includes(challengeId)) {
      progress.completedChallenges.push(challengeId);
      progress.lastActivity = new Date();
      await this.saveProgress(progress);
    }
  }

  async markChallengePeeked(challengeId: string): Promise<void> {
    const progress = await this.loadProgress();

    if (!progress.peekedChallenges.includes(challengeId)) {
      progress.peekedChallenges.push(challengeId);
      progress.lastActivity = new Date();
      await this.saveProgress(progress);
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    this.inMemorySettings = settings;

    if (!this.storageAvailable) {
      return;
    }

    try {
      if (this.useIndexedDB && this.db) {
        await this.idbPut(SETTINGS_STORE, SETTINGS_KEY, settings);
      } else {
        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch {
      this.reportStorageError('Failed to save settings.');
    }
  }

  async loadSettings(): Promise<UserSettings> {
    if (!this.storageAvailable) {
      return this.inMemorySettings;
    }

    try {
      if (this.useIndexedDB && this.db) {
        const stored = await this.idbGet<UserSettings>(
          SETTINGS_STORE,
          SETTINGS_KEY,
        );
        if (stored) {
          this.inMemorySettings = stored;
          return stored;
        }
      } else {
        const raw = localStorage.getItem(LS_SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as UserSettings;
          this.inMemorySettings = parsed;
          return parsed;
        }
      }
    } catch {
      this.reportStorageError('Failed to load settings.');
    }

    return this.inMemorySettings;
  }

  /**
   * Replaces local progress with remote data.
   * Writes directly to IndexedDB/localStorage and updates in-memory state.
   */
  async overwriteProgress(progress: UserProgress): Promise<void> {
    await this.saveProgress(progress);
  }

  /**
   * Replaces local settings with remote data.
   * Writes directly to IndexedDB/localStorage and updates in-memory state.
   */
  async overwriteSettings(settings: UserSettings): Promise<void> {
    await this.saveSettings(settings);
  }

  isStorageAvailable(): boolean {
    return this.storageAvailable;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
          db.createObjectStore(PROGRESS_STORE);
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private idbPut(
    storeName: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private tryIndexedDB(): boolean {
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  private tryLocalStorage(): boolean {
    try {
      const testKey = '__practica11y_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private reportStorageError(message: string): void {
    this.errorService.addError({
      id: `storage-error-${Date.now()}`,
      category: 'storage',
      message,
      recoverable: true,
      timestamp: new Date(),
    });
  }
}
