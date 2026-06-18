import { Achievement, Level } from './gamification.model';

export interface UserProgress {
  xp: number;
  completedChallenges: string[]; // Challenge-IDs
  achievements: Achievement[];
  currentLevel: Level;
  lastActivity: Date;
}

export interface UserSettings {
  editorTheme: 'light' | 'dark';
  fontSize: number;
  reducedMotion: boolean;
}
