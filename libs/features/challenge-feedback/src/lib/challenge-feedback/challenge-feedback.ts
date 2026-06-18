import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { AnalysisPipelineResult, AxeViolation } from '@practica11y/types';

interface ViolationGroup {
  impact: AxeViolation['impact'];
  violations: AxeViolation[];
}

const IMPACT_ORDER: AxeViolation['impact'][] = [
  'critical',
  'serious',
  'moderate',
  'minor',
];

@Component({
  selector: 'a11y-challenge-feedback',
  imports: [],
  templateUrl: './challenge-feedback.html',
  styleUrl: './challenge-feedback.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeFeedback {
  readonly result = input<AnalysisPipelineResult | null>(null);

  protected readonly validationResults = computed(
    () => this.result()?.validationResults ?? [],
  );

  protected readonly challengeCompleted = computed(
    () => this.result()?.challengeCompleted ?? false,
  );

  protected readonly violationGroups = computed<ViolationGroup[]>(() => {
    const axeResults = this.result()?.accessibilityAnalysis?.axeResults ?? [];
    return IMPACT_ORDER.map((impact) => ({
      impact,
      violations: axeResults.filter((v) => v.impact === impact),
    })).filter((group) => group.violations.length > 0);
  });

  protected readonly hasViolations = computed(
    () => this.violationGroups().length > 0,
  );
}
