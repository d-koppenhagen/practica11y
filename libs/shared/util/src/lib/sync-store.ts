import { inject, Injectable, signal } from '@angular/core';

import {
  SerializedAchievement,
  SerializedUserProgress,
  SyncDirection,
  SyncPayload,
  SyncState,
  UserProgress,
  UserSettings,
} from '@practica11y/types';

import { AuthStore } from './auth-store';
import { ErrorService } from './error-service';
import { Gamification } from './gamification';
import { ProgressStore } from './progress-store';

const GIST_FILENAME = 'practica11y-sync.json';
const GITHUB_API_BASE = 'https://api.github.com';

@Injectable({ providedIn: 'root' })
export class SyncStore {
  private readonly authStore = inject(AuthStore);
  private readonly progressStore = inject(ProgressStore);
  private readonly gamification = inject(Gamification);
  private readonly errorService = inject(ErrorService);

  readonly state = signal<SyncState>('idle');
  readonly lastError = signal<string | null>(null);
  private syncing = false;

  async sync(): Promise<void> {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.state.set('syncing');
    this.lastError.set(null);

    try {
      const token = this.authStore.getToken();
      if (!token) {
        return;
      }

      const gists = await this.listGists(token);
      const gistId = this.findSyncGist(gists);

      if (!gistId) {
        // No remote gist exists — create one with local data
        const progress = await this.progressStore.loadProgress();
        const settings = await this.progressStore.loadSettings();
        const payload = this.serialize(progress, settings);
        await this.createGist(token, payload);
      } else {
        const remotePayload = await this.readGist(token, gistId);
        const { progress: remoteProgress, settings: remoteSettings } =
          this.deserialize(remotePayload);

        const localProgress = await this.progressStore.loadProgress();
        const localSettings = await this.progressStore.loadSettings();

        // Merge local and remote progress
        const merged = this.mergeProgress(localProgress, remoteProgress);

        // Determine if anything changed compared to remote
        const remoteChanged = !this.progressEquals(merged, remoteProgress);
        const localChanged = !this.progressEquals(merged, localProgress);

        // Use the most recent settings (last-write-wins for settings only)
        const mergedSettings =
          localProgress.lastActivity > remoteProgress.lastActivity
            ? localSettings
            : remoteSettings;

        if (localChanged) {
          // Update local with merged data
          await this.progressStore.overwriteProgress(merged);
          await this.progressStore.overwriteSettings(mergedSettings);
          this.gamification.currentXP.set(merged.xp);
          this.gamification.achievements.set(merged.achievements);
        }

        if (remoteChanged) {
          // Update remote with merged data
          const payload = this.serialize(merged, mergedSettings);
          await this.updateGist(token, gistId, payload);
        }
      }

      this.state.set('success');
      setTimeout(() => this.state.set('idle'), 2000);
    } catch (error) {
      if (error instanceof AuthError) {
        this.authStore.logout();
        this.lastError.set('Authentication failed. Please sign in again.');
        this.state.set('error');
      } else {
        const message = error instanceof Error ? error.message : 'Sync failed';
        this.lastError.set(message);
        this.state.set('error');
        this.errorService.addError({
          id: `sync-error-${Date.now()}`,
          category: 'network',
          message,
          recoverable: true,
          timestamp: new Date(),
        });
      }
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Merges two UserProgress objects by taking the union of challenges
   * and achievements, summing XP based on the merged challenge count,
   * and using the most recent lastActivity.
   */
  mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
    // Union of completed challenges (no duplicates)
    const completedChallenges = [
      ...new Set([...local.completedChallenges, ...remote.completedChallenges]),
    ];

    // Union of peeked challenges (no duplicates)
    const peekedChallenges = [
      ...new Set([...local.peekedChallenges, ...remote.peekedChallenges]),
    ];

    // Union of achievements by ID, keeping the one with the earliest unlockedAt
    const achievementMap = new Map<
      string,
      UserProgress['achievements'][number]
    >();
    for (const a of [...remote.achievements, ...local.achievements]) {
      const existing = achievementMap.get(a.id);
      if (!existing) {
        achievementMap.set(a.id, a);
      } else if (
        a.unlockedAt &&
        existing.unlockedAt &&
        a.unlockedAt < existing.unlockedAt
      ) {
        achievementMap.set(a.id, a);
      }
    }
    const achievements = [...achievementMap.values()];

    // XP: take the higher value since we can't recalculate per-challenge points here.
    // The higher XP reflects more progress earned.
    const xp = Math.max(local.xp, remote.xp);

    // Use the most recent lastActivity
    const lastActivity =
      local.lastActivity > remote.lastActivity
        ? local.lastActivity
        : remote.lastActivity;

    // Level: use the level corresponding to the higher XP
    const currentLevel =
      local.xp >= remote.xp ? local.currentLevel : remote.currentLevel;

    return {
      xp,
      completedChallenges,
      peekedChallenges,
      achievements,
      currentLevel,
      lastActivity,
    };
  }

  /**
   * Checks if two UserProgress objects are equivalent (same data).
   */
  private progressEquals(a: UserProgress, b: UserProgress): boolean {
    if (a.xp !== b.xp) return false;
    if (a.completedChallenges.length !== b.completedChallenges.length)
      return false;
    if (a.peekedChallenges.length !== b.peekedChallenges.length) return false;
    if (a.achievements.length !== b.achievements.length) return false;

    const sortedA = [...a.completedChallenges].sort();
    const sortedB = [...b.completedChallenges].sort();
    if (sortedA.some((v, i) => v !== sortedB[i])) return false;

    return true;
  }

  resolveConflict(localTimestamp: Date, remoteTimestamp: Date): SyncDirection {
    if (localTimestamp > remoteTimestamp) return 'push';
    if (remoteTimestamp > localTimestamp) return 'pull';
    return 'none';
  }

  serialize(progress: UserProgress, settings: UserSettings): SyncPayload {
    const serializedProgress: SerializedUserProgress = {
      xp: progress.xp,
      completedChallenges: progress.completedChallenges,
      peekedChallenges: progress.peekedChallenges,
      achievements: progress.achievements.map((a): SerializedAchievement => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt?.toISOString(),
      })),
      currentLevel: progress.currentLevel,
      lastActivity: progress.lastActivity.toISOString(),
    };

    return {
      version: 1,
      progress: serializedProgress,
      settings,
    };
  }

  deserialize(payload: SyncPayload): {
    progress: UserProgress;
    settings: UserSettings;
  } {
    const progress: UserProgress = {
      xp: payload.progress.xp,
      completedChallenges: payload.progress.completedChallenges,
      peekedChallenges: payload.progress.peekedChallenges,
      achievements: payload.progress.achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
      })),
      currentLevel: payload.progress.currentLevel,
      lastActivity: new Date(payload.progress.lastActivity),
    };

    return { progress, settings: payload.settings };
  }

  findSyncGist(
    gists: Array<{ id: string; files: Record<string, unknown> }>,
  ): string | null {
    const match = gists.find((gist) => GIST_FILENAME in gist.files);
    return match?.id ?? null;
  }

  private async listGists(
    token: string,
  ): Promise<Array<{ id: string; files: Record<string, unknown> }>> {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    this.handleAuthError(response);

    if (!response.ok) {
      throw new Error(`Failed to list gists: ${response.status}`);
    }

    return response.json();
  }

  private async readGist(token: string, gistId: string): Promise<SyncPayload> {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    this.handleAuthError(response);

    if (!response.ok) {
      throw new Error(`Failed to read gist: ${response.status}`);
    }

    const gist = await response.json();
    const content = gist.files[GIST_FILENAME]?.content;
    if (!content) {
      throw new Error('Sync file not found in gist');
    }

    return JSON.parse(content) as SyncPayload;
  }

  private async createGist(token: string, payload: SyncPayload): Promise<void> {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Practica11y progress sync',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload),
          },
        },
      }),
    });

    this.handleAuthError(response);

    if (!response.ok) {
      throw new Error(`Failed to create gist: ${response.status}`);
    }
  }

  private async updateGist(
    token: string,
    gistId: string,
    payload: SyncPayload,
  ): Promise<void> {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload),
          },
        },
      }),
    });

    this.handleAuthError(response);

    if (!response.ok) {
      throw new Error(`Failed to update gist: ${response.status}`);
    }
  }

  private handleAuthError(response: Response): void {
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(`Authentication error: ${response.status}`);
    }
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
