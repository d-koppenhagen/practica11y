export type Level = 'hatchling' | 'scout' | 'guardian' | 'legend';

export interface LevelThreshold {
  level: Level;
  minXP: number;
  label: string;
  emoji: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 'hatchling', minXP: 0, label: 'Hatchling', emoji: '🌱' },
  { level: 'scout', minXP: 500, label: 'Scout', emoji: '🦎' },
  { level: 'guardian', minXP: 1500, label: 'Guardian', emoji: '🐊' },
  { level: 'legend', minXP: 5000, label: 'Accessibility Legend', emoji: '👑' },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface GamificationEvent {
  type: 'challenge_completed' | 'category_mastered' | 'streak';
  payload: Record<string, unknown>;
}
