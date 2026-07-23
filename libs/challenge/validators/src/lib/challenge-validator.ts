import { Injectable } from '@angular/core';
import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Registry-based validator service that manages and executes challenge validators.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeValidator {
  private readonly validators = new Map<string, Validator>();

  /**
   * Registers a validator instance in the registry.
   * Overwrites any existing validator with the same id.
   */
  registerValidator(validator: Validator): void {
    this.validators.set(validator.id, validator);
  }

  /**
   * Validates a challenge by running the specified validators against the document.
   * Validators that are not registered will be skipped with a failing result.
   * Supports both sync and async validators.
   */
  async validateChallenge(
    document: Document,
    validatorIds: string[],
    analysisResult: AccessibilityAnalysisResult,
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const id of validatorIds) {
      const validator = this.validators.get(id);
      if (!validator) {
        results.push({
          validatorId: id,
          passed: false,
          message: `Validator "${id}" not found in registry.`,
        });
        continue;
      }
      const result = await validator.validate(document, analysisResult);
      results.push(result);
    }

    return results;
  }
}
