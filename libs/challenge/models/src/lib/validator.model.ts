/**
 * Represents a challenge validator that checks specific accessibility criteria.
 * The optional `context` parameter allows validators to use pre-computed
 * accessibility analysis data instead of re-analyzing the document.
 */
export interface Validator {
  id: string;
  validate(document: Document, context?: unknown): ValidationResult;
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
