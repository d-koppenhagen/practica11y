import { TestBed } from '@angular/core/testing';
import { Gamification } from './gamification';
import { GamificationEvent } from '@practica11y/types';

describe('Gamification', () => {
  let service: Gamification;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Gamification);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('XP addition', () => {
    it('should add XP and update signal value', () => {
      service.addXP(100);
      expect(service.currentXP()).toBe(100);
    });

    it('should accumulate multiple XP additions', () => {
      service.addXP(100);
      service.addXP(200);
      service.addXP(50);
      expect(service.currentXP()).toBe(350);
    });
  });

  describe('Level calculation', () => {
    it('should return hatchling for 0 XP', () => {
      expect(service.calculateLevel(0)).toBe('hatchling');
    });

    it('should return hatchling for 499 XP', () => {
      expect(service.calculateLevel(499)).toBe('hatchling');
    });

    it('should return scout for 500 XP', () => {
      expect(service.calculateLevel(500)).toBe('scout');
    });

    it('should return scout for 1499 XP', () => {
      expect(service.calculateLevel(1499)).toBe('scout');
    });

    it('should return guardian for 1500 XP', () => {
      expect(service.calculateLevel(1500)).toBe('guardian');
    });

    it('should return legend for 5000 XP', () => {
      expect(service.calculateLevel(5000)).toBe('legend');
    });

    it('should reflect level in computed signal', () => {
      expect(service.currentLevel()).toBe('hatchling');
      service.addXP(500);
      expect(service.currentLevel()).toBe('scout');
    });
  });

  describe('Level-Up event', () => {
    it('should emit level-up event when crossing threshold', () => {
      service.addXP(500);
      expect(service.levelUpEvent()).toBe('scout');
    });

    it('should not change levelUpEvent when staying within same level', () => {
      service.addXP(100);
      expect(service.levelUpEvent()).toBeNull();
      service.addXP(100);
      expect(service.levelUpEvent()).toBeNull();
    });

    it('should update levelUpEvent on each level transition', () => {
      service.addXP(500);
      expect(service.levelUpEvent()).toBe('scout');
      service.addXP(1000);
      expect(service.levelUpEvent()).toBe('guardian');
    });
  });

  describe('Achievement check', () => {
    it('should return first-challenge achievement for completedCount 1', () => {
      const event: GamificationEvent = {
        type: 'challenge_completed',
        payload: { completedCount: 1 },
      };
      const result = service.checkAchievements(event);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('first-challenge');
      expect(result!.title).toBe('First Steps');
    });

    it('should return ten-challenges achievement for completedCount 10', () => {
      const event: GamificationEvent = {
        type: 'challenge_completed',
        payload: { completedCount: 10 },
      };
      const result = service.checkAchievements(event);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('ten-challenges');
      expect(result!.title).toBe('Getting Serious');
    });

    it('should return null for completedCount 5 (no matching achievement)', () => {
      const event: GamificationEvent = {
        type: 'challenge_completed',
        payload: { completedCount: 5 },
      };
      const result = service.checkAchievements(event);
      expect(result).toBeNull();
    });

    it('should return matching achievement for category_mastered', () => {
      const event: GamificationEvent = {
        type: 'category_mastered',
        payload: { category: 'semantics' },
      };
      const result = service.checkAchievements(event);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('master-semantics');
      expect(result!.title).toBe('semantics Master');
    });

    it('should return week-streak achievement for streak with days >= 7', () => {
      const event: GamificationEvent = {
        type: 'streak',
        payload: { days: 7 },
      };
      const result = service.checkAchievements(event);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('week-streak');
      expect(result!.title).toBe('Week Warrior');
    });

    it('should return null for streak with days < 7', () => {
      const event: GamificationEvent = {
        type: 'streak',
        payload: { days: 3 },
      };
      const result = service.checkAchievements(event);
      expect(result).toBeNull();
    });
  });

  describe('Achievement accumulation', () => {
    it('should add unlocked achievement to achievements signal', () => {
      const event: GamificationEvent = {
        type: 'challenge_completed',
        payload: { completedCount: 1 },
      };
      service.checkAchievements(event);
      const achievements = service.achievements();
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('first-challenge');
      expect(achievements[0].unlockedAt).toBeInstanceOf(Date);
    });

    it('should accumulate multiple achievements', () => {
      service.checkAchievements({
        type: 'challenge_completed',
        payload: { completedCount: 1 },
      });
      service.checkAchievements({
        type: 'streak',
        payload: { days: 7 },
      });
      expect(service.achievements()).toHaveLength(2);
    });

    it('should not add to achievements when checkAchievements returns null', () => {
      service.checkAchievements({
        type: 'challenge_completed',
        payload: { completedCount: 5 },
      });
      expect(service.achievements()).toHaveLength(0);
    });
  });
});
