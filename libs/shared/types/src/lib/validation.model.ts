/**
 * Represents the result of a single validator execution.
 * Defined in shared/types to keep the dependency graph valid
 * (shared libs cannot import from challenge libs).
 */
export interface ValidationResult {
  validatorId: string;
  passed: boolean;
  message: string;
  details?: string;
}
