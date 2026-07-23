/**
 * Represents a challenge validator that checks specific accessibility criteria.
 * The optional `context` parameter allows validators to use pre-computed
 * accessibility analysis data instead of re-analyzing the document.
 *
 * Validators may return a result synchronously or asynchronously.
 * The validation pipeline awaits all results.
 */
export interface Validator {
  id: string;
  validate(
    document: Document,
    context?: unknown,
  ): ValidationResult | Promise<ValidationResult>;
}

/**
 * Represents the result of a single validator execution.
 */
export interface ValidationResult {
  validatorId: string;
  passed: boolean;
  message: string;
  details?: string;
}
