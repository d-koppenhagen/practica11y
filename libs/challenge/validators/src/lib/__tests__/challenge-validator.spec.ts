import { describe, it, expect, beforeEach } from 'vitest';
import { ChallengeValidator } from '../challenge-validator';
import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

function createMockValidator(id: string, result: boolean): Validator {
  return {
    id,
    validate: (): ValidationResult => ({
      validatorId: id,
      passed: result,
      message: result ? `${id} passed` : `${id} failed`,
    }),
  };
}

function createMockAnalysisResult(): AccessibilityAnalysisResult {
  return {
    axeResults: [],
    treeNodes: { role: 'document', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
  };
}

describe('ChallengeValidator', () => {
  let service: ChallengeValidator;

  beforeEach(() => {
    service = new ChallengeValidator();
  });

  describe('Registered validators are all executed', () => {
    it('should return results for all registered validator IDs', async () => {
      const validatorA = createMockValidator('validator-a', true);
      const validatorB = createMockValidator('validator-b', true);
      const validatorC = createMockValidator('validator-c', true);

      service.registerValidator(validatorA);
      service.registerValidator(validatorB);
      service.registerValidator(validatorC);

      const ids = ['validator-a', 'validator-b', 'validator-c'];
      const results = await service.validateChallenge(
        document,
        ids,
        createMockAnalysisResult(),
      );

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.validatorId)).toEqual(ids);
    });

    it('should return one result per validator ID', async () => {
      service.registerValidator(createMockValidator('v1', true));
      service.registerValidator(createMockValidator('v2', false));

      const results = await service.validateChallenge(
        document,
        ['v1', 'v2'],
        createMockAnalysisResult(),
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('All passed → Challenge recognized as completed', () => {
    it('should have all results with passed=true when all validators pass', async () => {
      service.registerValidator(createMockValidator('a', true));
      service.registerValidator(createMockValidator('b', true));
      service.registerValidator(createMockValidator('c', true));

      const results = await service.validateChallenge(
        document,
        ['a', 'b', 'c'],
        createMockAnalysisResult(),
      );

      expect(results.every((r) => r.passed)).toBe(true);
    });
  });

  describe('One failed validator → Challenge not completed', () => {
    it('should have at least one result with passed=false when one validator fails', async () => {
      service.registerValidator(createMockValidator('pass-1', true));
      service.registerValidator(createMockValidator('fail-1', false));
      service.registerValidator(createMockValidator('pass-2', true));

      const results = await service.validateChallenge(
        document,
        ['pass-1', 'fail-1', 'pass-2'],
        createMockAnalysisResult(),
      );

      expect(results.some((r) => !r.passed)).toBe(true);
      expect(results.every((r) => r.passed)).toBe(false);
    });

    it('should correctly identify which validator failed', async () => {
      service.registerValidator(createMockValidator('pass', true));
      service.registerValidator(createMockValidator('fail', false));

      const results = await service.validateChallenge(
        document,
        ['pass', 'fail'],
        createMockAnalysisResult(),
      );

      const failedResult = results.find((r) => r.validatorId === 'fail');
      expect(failedResult?.passed).toBe(false);
    });
  });

  describe('Unregistered validator → Error message', () => {
    it('should return a failing result with error message for unregistered validator ID', async () => {
      service.registerValidator(createMockValidator('registered', true));

      const results = await service.validateChallenge(
        document,
        ['registered', 'unknown-validator'],
        createMockAnalysisResult(),
      );

      expect(results).toHaveLength(2);
      const unknownResult = results.find(
        (r) => r.validatorId === 'unknown-validator',
      );
      expect(unknownResult).toBeDefined();
      expect(unknownResult!.passed).toBe(false);
      expect(unknownResult!.message).toContain('unknown-validator');
    });

    it('should pass registered validator even when others are not found', async () => {
      service.registerValidator(createMockValidator('registered', true));

      const results = await service.validateChallenge(
        document,
        ['registered', 'missing'],
        createMockAnalysisResult(),
      );

      const registeredResult = results.find(
        (r) => r.validatorId === 'registered',
      );
      expect(registeredResult?.passed).toBe(true);
    });
  });

  describe('registerValidator overwrites existing', () => {
    it('should use the latest registered validator for a given ID', async () => {
      service.registerValidator(createMockValidator('v1', false));
      service.registerValidator(createMockValidator('v1', true));

      const results = await service.validateChallenge(
        document,
        ['v1'],
        createMockAnalysisResult(),
      );

      expect(results[0].passed).toBe(true);
    });
  });
});
