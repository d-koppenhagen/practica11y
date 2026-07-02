import { Level } from './gamification.model';
import { UserSettings } from './persistence.model';

/** State of the OAuth authentication lifecycle */
export type AuthState = 'unauthenticated' | 'polling' | 'authenticated';

/** Sync operation state */
export type SyncState = 'idle' | 'syncing' | 'success' | 'error';

/** Direction resolved by conflict resolution */
export type SyncDirection = 'push' | 'pull' | 'none';

/** Cached GitHub user profile */
export interface GitHubUser {
  login: string;
  avatarUrl: string;
}

/** Response from GitHub's device code endpoint */
export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

/** Payload stored in the sync Gist */
export interface SyncPayload {
  version: 1;
  progress: SerializedUserProgress;
  settings: UserSettings;
}

export interface SerializedUserProgress {
  xp: number;
  completedChallenges: string[];
  peekedChallenges: string[];
  achievements: SerializedAchievement[];
  currentLevel: Level;
  lastActivity: string; // ISO 8601
}

export interface SerializedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO 8601
}

/** Stored auth credentials in localStorage */
export interface StoredAuthData {
  token: string;
  user: GitHubUser;
}
