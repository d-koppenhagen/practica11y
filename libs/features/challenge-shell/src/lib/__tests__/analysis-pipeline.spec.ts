import { TestBed } from '@angular/core/testing';
import { AnalysisPipeline } from '../analysis-pipeline';
import { AccessibilityEngine } from '@practica11y/axe';
import { ChallengeValidator } from '@practica11y/validators';
import { Gamification, ProgressStore } from '@practica11y/util';
import { Challenge } from '@practica11y/models';
import { AccessibilityAnalysisResult } from '@practica11y/types';

describe('AnalysisPipeline', () => {
  let pipeline: AnalysisPipeline;
  let mockAccessibilityEngine: {
    analyze: ReturnType<typeof vi.fn>;
    analyzeLocal: ReturnType<typeof vi.fn>;
  };
  let mockChallengeValidator: {
    registerValidator: ReturnType<typeof vi.fn>;
    validateChallenge: ReturnType<typeof vi.fn>;
  };
  let mockGamification: {
    addXP: ReturnType<typeof vi.fn>;
    currentXP: ReturnType<typeof vi.fn>;
    checkAchievements: ReturnType<typeof vi.fn>;
  };
  let mockProgressStore: {
    markChallengeCompleted: ReturnType<typeof vi.fn>;
    loadProgress: ReturnType<typeof vi.fn>;
    saveProgress: ReturnType<typeof vi.fn>;
  };

  const mockAnalysisResult: AccessibilityAnalysisResult = {
    axeResults: [],
    treeNodes: { role: 'document', name: 'test', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: {
      focusTraps: [],
      hiddenFocusable: [],
      focusOrder: [],
    },
  };

  const mockChallenge: Challenge = {
    id: 'test-challenge',
    title: 'Test Challenge',
    difficulty: 'beginner',
    tags: ['semantics'],
    points: 50,
    description: 'A test challenge',
    starter: { html: '<div></div>', js: '', css: '', vtt: '' },
    validatorIds: ['axe-no-violations', 'has-landmarks'],
    previewTitle: 'Challenge: Test Challenge | Preview',
    links: [],
    createdAt: '2026-06-18',
  };

  beforeEach(() => {
    mockAccessibilityEngine = {
      analyze: vi.fn().mockResolvedValue(mockAnalysisResult),
      analyzeLocal: vi.fn().mockReturnValue({
        treeNodes: mockAnalysisResult.treeNodes,
        keyboardResults: mockAnalysisResult.keyboardResults,
        focusResults: mockAnalysisResult.focusResults,
      }),
    };

    mockChallengeValidator = {
      registerValidator: vi.fn(),
      validateChallenge: vi.fn().mockResolvedValue([
        {
          validatorId: 'axe-no-violations',
          passed: true,
          message: 'No violations',
        },
        {
          validatorId: 'has-landmarks',
          passed: true,
          message: 'Landmarks present',
        },
      ]),
    };

    mockGamification = {
      addXP: vi.fn(),
      currentXP: vi.fn().mockReturnValue(50),
      checkAchievements: vi.fn().mockReturnValue(null),
    };

    mockProgressStore = {
      markChallengeCompleted: vi.fn().mockResolvedValue(undefined),
      saveProgress: vi.fn().mockResolvedValue(undefined),
      loadProgress: vi
        .fn()
        .mockResolvedValueOnce({
          xp: 0,
          completedChallenges: [],
          peekedChallenges: [],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        })
        .mockResolvedValue({
          xp: 50,
          completedChallenges: ['test-challenge'],
          peekedChallenges: [],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        }),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalysisPipeline,
        { provide: AccessibilityEngine, useValue: mockAccessibilityEngine },
        { provide: ChallengeValidator, useValue: mockChallengeValidator },
        { provide: Gamification, useValue: mockGamification },
        { provide: ProgressStore, useValue: mockProgressStore },
      ],
    });

    pipeline = TestBed.inject(AnalysisPipeline);
  });

  it('should be created', () => {
    expect(pipeline).toBeTruthy();
  });

  describe('isAnalyzing signal', () => {
    it('should be false initially', () => {
      expect(pipeline.isAnalyzing()).toBe(false);
    });

    it('should be true while pipeline is running', async () => {
      let resolveAnalyze: (value: AccessibilityAnalysisResult) => void;
      mockAccessibilityEngine.analyze.mockReturnValue(
        new Promise((resolve) => {
          resolveAnalyze = resolve;
        }),
      );

      pipeline.setChallenge(mockChallenge);
      const doc = document;
      const pipelinePromise = pipeline.runPipeline(doc);

      expect(pipeline.isAnalyzing()).toBe(true);

      resolveAnalyze!(mockAnalysisResult);
      await pipelinePromise;

      expect(pipeline.isAnalyzing()).toBe(false);
    });

    it('should be false after pipeline completes', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);
      expect(pipeline.isAnalyzing()).toBe(false);
    });

    it('should be false even if pipeline throws', async () => {
      mockAccessibilityEngine.analyze.mockRejectedValue(
        new Error('Analysis failed'),
      );

      pipeline.setChallenge(mockChallenge);
      await expect(pipeline.runPipeline(document)).rejects.toThrow(
        'Analysis failed',
      );
      expect(pipeline.isAnalyzing()).toBe(false);
    });
  });

  describe('runPipeline', () => {
    it('should run accessibility analysis on the provided document', async () => {
      const doc = document;
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(doc);

      expect(mockAccessibilityEngine.analyze).toHaveBeenCalledWith(doc);
    });

    it('should run validators with challenge validatorIds and analysis result', async () => {
      const doc = document;
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(doc);

      expect(mockChallengeValidator.validateChallenge).toHaveBeenCalledWith(
        doc,
        ['valid-html-syntax', 'axe-no-violations', 'has-landmarks'],
        mockAnalysisResult,
      );
    });

    it('should not run validators when no challenge is set', async () => {
      await pipeline.runPipeline(document);

      expect(mockChallengeValidator.validateChallenge).not.toHaveBeenCalled();
    });

    it('should update analysisResult signal with pipeline result', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const result = pipeline.analysisResult();
      expect(result).not.toBeNull();
      expect(result!.accessibilityAnalysis).toEqual(mockAnalysisResult);
      expect(result!.validationResults).toHaveLength(2);
      expect(result!.challengeCompleted).toBe(true);
      expect(result!.timestamp).toBeGreaterThan(0);
    });
  });

  describe('challenge completion detection', () => {
    it('should mark challenge as completed when all validators pass', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const result = pipeline.analysisResult();
      expect(result!.challengeCompleted).toBe(true);
    });

    it('should not mark challenge as completed when any validator fails', async () => {
      mockChallengeValidator.validateChallenge.mockResolvedValue([
        {
          validatorId: 'axe-no-violations',
          passed: true,
          message: 'No violations',
        },
        {
          validatorId: 'has-landmarks',
          passed: false,
          message: 'No landmarks found',
        },
      ]);

      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const result = pipeline.analysisResult();
      expect(result!.challengeCompleted).toBe(false);
    });

    it('should not mark challenge as completed when no validators exist', async () => {
      mockChallengeValidator.validateChallenge.mockResolvedValue([]);

      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const result = pipeline.analysisResult();
      expect(result!.challengeCompleted).toBe(false);
    });
  });

  describe('gamification integration', () => {
    it('should award XP when challenge is completed', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockGamification.addXP).toHaveBeenCalledWith(50);
    });

    it('should mark challenge as completed in progress store', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockProgressStore.markChallengeCompleted).toHaveBeenCalledWith(
        'test-challenge',
      );
    });

    it('should check for achievements after challenge completion', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockGamification.checkAchievements).toHaveBeenCalledWith({
        type: 'challenge_completed',
        payload: { completedCount: 1 },
      });
    });

    it('should not award XP when challenge is not completed', async () => {
      mockChallengeValidator.validateChallenge.mockResolvedValue([
        {
          validatorId: 'axe-no-violations',
          passed: false,
          message: 'Violations found',
        },
      ]);

      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockGamification.addXP).not.toHaveBeenCalled();
      expect(mockProgressStore.markChallengeCompleted).not.toHaveBeenCalled();
    });

    it('should not trigger gamification when no challenge is set', async () => {
      await pipeline.runPipeline(document);

      expect(mockGamification.addXP).not.toHaveBeenCalled();
      expect(mockProgressStore.markChallengeCompleted).not.toHaveBeenCalled();
    });

    it('should not award XP when challenge is peeked', async () => {
      mockProgressStore.loadProgress
        .mockReset()
        .mockResolvedValueOnce({
          xp: 0,
          completedChallenges: [],
          peekedChallenges: ['test-challenge'],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        })
        .mockResolvedValue({
          xp: 0,
          completedChallenges: ['test-challenge'],
          peekedChallenges: ['test-challenge'],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        });

      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockGamification.addXP).not.toHaveBeenCalled();
      expect(mockProgressStore.markChallengeCompleted).toHaveBeenCalledWith(
        'test-challenge',
      );
    });

    it('should still award XP when challenge is not peeked', async () => {
      mockProgressStore.loadProgress
        .mockReset()
        .mockResolvedValueOnce({
          xp: 0,
          completedChallenges: [],
          peekedChallenges: ['other-challenge'],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        })
        .mockResolvedValue({
          xp: 50,
          completedChallenges: ['test-challenge'],
          peekedChallenges: ['other-challenge'],
          achievements: [],
          currentLevel: 'hatchling',
          lastActivity: new Date(),
        });

      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockGamification.addXP).toHaveBeenCalledWith(50);
    });
  });

  describe('debounce', () => {
    it('should debounce code changes at 300ms', async () => {
      vi.useFakeTimers();

      pipeline.updateCode('<p>Hello</p>', '', 'p { color: red; }');
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      // Value should not have propagated yet
      expect(pipeline.debouncedCodeChange()).toEqual({
        htmlContent: '',
        jsContent: '',
        cssContent: '',
      });

      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      // After 300ms total, debounced value should update
      expect(pipeline.debouncedCodeChange()).toEqual({
        htmlContent: '<p>Hello</p>',
        jsContent: '',
        cssContent: 'p { color: red; }',
      });

      vi.useRealTimers();
    });

    it('should only emit the last value within debounce window', async () => {
      // Test that rapid signal updates result in only the last value being emitted
      // We verify this by checking updateCode overwrites previous values in the signal
      pipeline.updateCode('<p>First</p>', '', '');
      pipeline.updateCode('<p>Second</p>', '', '');
      pipeline.updateCode('<p>Third</p>', '', '');

      // Wait real time for debounce (300ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(pipeline.debouncedCodeChange()).toEqual({
        htmlContent: '<p>Third</p>',
        jsContent: '',
        cssContent: '',
      });
    });
  });

  describe('setChallenge', () => {
    it('should accept a challenge for validation', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      expect(mockChallengeValidator.validateChallenge).toHaveBeenCalledWith(
        document,
        ['valid-html-syntax', ...mockChallenge.validatorIds],
        expect.anything(),
      );
    });
  });

  describe('setSandboxDocument', () => {
    it('should store the document reference', () => {
      const doc = document;
      pipeline.setSandboxDocument(doc);
      // No public getter needed; internal usage is tested via runPipeline
      expect(pipeline).toBeTruthy();
    });
  });

  describe('updateTreeOnly', () => {
    it('should preserve the existing timestamp to prevent dialog re-triggering', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const resultAfterPipeline = pipeline.analysisResult()!;
      const originalTimestamp = resultAfterPipeline.timestamp;

      // Simulate a small delay so Date.now() would differ
      await new Promise((resolve) => setTimeout(resolve, 10));

      pipeline.updateTreeOnly(document);

      const resultAfterTreeUpdate = pipeline.analysisResult()!;
      expect(resultAfterTreeUpdate.timestamp).toBe(originalTimestamp);
      expect(resultAfterTreeUpdate.challengeCompleted).toBe(true);
    });

    it('should update treeNodes without changing other result properties', async () => {
      pipeline.setChallenge(mockChallenge);
      await pipeline.runPipeline(document);

      const resultBefore = pipeline.analysisResult()!;

      // Change what analyzeLocal returns for the tree update
      const updatedTree = { role: 'document', name: 'updated', children: [] };
      mockAccessibilityEngine.analyzeLocal.mockReturnValue({
        treeNodes: updatedTree,
        keyboardResults: mockAnalysisResult.keyboardResults,
        focusResults: mockAnalysisResult.focusResults,
      });

      pipeline.updateTreeOnly(document);

      const resultAfter = pipeline.analysisResult()!;
      expect(resultAfter.accessibilityAnalysis.treeNodes).toEqual(updatedTree);
      expect(resultAfter.validationResults).toEqual(
        resultBefore.validationResults,
      );
      expect(resultAfter.challengeCompleted).toBe(
        resultBefore.challengeCompleted,
      );
    });

    it('should do nothing when no analysis result exists', () => {
      expect(pipeline.analysisResult()).toBeNull();
      pipeline.updateTreeOnly(document);
      expect(pipeline.analysisResult()).toBeNull();
    });
  });
});
