import { AccessibilityAnalysisResult } from './accessibility.model';
import { ValidationResult } from './validation.model';

export interface AnalysisPipelineResult {
  validationResults: ValidationResult[];
  accessibilityAnalysis: AccessibilityAnalysisResult;
  challengeCompleted: boolean;
  timestamp: number;
}
