import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { AnalysisPipelineResult } from '@practica11y/types';
import { ChallengeFeedback } from '@practica11y/challenge-feedback';
import { EmptyAction } from '@practica11y/ui';

export type FeedbackState = 'button' | 'loading' | 'results';

@Component({
  selector: 'a11y-feedback-panel',
  imports: [ChallengeFeedback, EmptyAction],
  templateUrl: './feedback-panel.html',
  styleUrl: './feedback-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackPanel {
  /** Current feedback state driven by the parent */
  readonly state = input.required<FeedbackState>();

  /** Analysis result to display when state is 'results' */
  readonly analysisResult = input<AnalysisPipelineResult | null>(null);

  /** Emits when user clicks "Check Solution" */
  readonly checkSolution = output<void>();

  protected onCheckSolution(): void {
    this.checkSolution.emit();
  }
}
