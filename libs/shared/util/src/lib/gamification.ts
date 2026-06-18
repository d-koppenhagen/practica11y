import { computed, Injectable, signal } from '@angular/core';

import {
  Achievement,
  GamificationEvent,
  Level,
  LEVEL_THRESHOLDS,
} from '@practica11y/types';

@Injectable({ providedIn: 'root' })
export class Gamification {
  readonly currentXP = signal<number>(0);
  readonly currentLevel = computed<Level>(() =>
    this.calculateLevel(this.currentXP()),
  );
  readonly achievements = signal<Achievement[]>([]);
  readonly levelUpEvent = signal<Level | null>(null);

  addXP(points: number): void {
    const previousLevel = this.currentLevel();
    this.currentXP.update((xp) => xp + points);
    const newLevel = this.currentLevel();

    if (newLevel !== previousLevel) {
      this.levelUpEvent.set(newLevel);
    }
  }

  calculateLevel(xp: number): Level {
    const sorted = [...LEVEL_THRESHOLDS].sort((a, b) => b.minXP - a.minXP);
    const threshold = sorted.find((t) => xp >= t.minXP);
    return threshold?.level ?? 'hatchling';
  }

  checkAchievements(event: GamificationEvent): Achievement | null {
    const achievement = this.resolveAchievement(event);
    if (achievement) {
      const unlocked: Achievement = {
        ...achievement,
        unlockedAt: new Date(),
      };
      this.achievements.update((list) => [...list, unlocked]);
      return unlocked;
    }
    return null;
  }

  private resolveAchievement(event: GamificationEvent): Achievement | null {
    switch (event.type) {
      case 'challenge_completed': {
        const count = (event.payload['completedCount'] as number) ?? 0;
        if (count === 1) {
          return {
            id: 'first-challenge',
            title: 'First Steps',
            description: 'Completed your first challenge',
            icon: '🎯',
          };
        }
        if (count === 10) {
          return {
            id: 'ten-challenges',
            title: 'Getting Serious',
            description: 'Completed 10 challenges',
            icon: '🔥',
          };
        }
        return null;
      }
      case 'category_mastered': {
        const category = (event.payload['category'] as string) ?? '';
        return {
          id: `master-${category}`,
          title: `${category} Master`,
          description: `Mastered all ${category} challenges`,
          icon: '🏆',
        };
      }
      case 'streak': {
        const days = (event.payload['days'] as number) ?? 0;
        if (days >= 7) {
          return {
            id: 'week-streak',
            title: 'Week Warrior',
            description: '7-day learning streak',
            icon: '⚡',
          };
        }
        return null;
      }
      default:
        return null;
    }
  }
}
