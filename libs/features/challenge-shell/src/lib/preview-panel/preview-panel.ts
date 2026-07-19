import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
} from '@angular/core';
import { SandboxPreview, SandboxAxeViolation } from '@practica11y/sandbox';
import { PreferenceSimulationStore } from '@practica11y/util';

@Component({
  selector: 'a11y-preview-panel',
  imports: [SandboxPreview],
  templateUrl: './preview-panel.html',
  styleUrl: './preview-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPanel {
  private readonly simulationStore = inject(PreferenceSimulationStore);
  protected readonly simulationCss = this.simulationStore.simulationCss;

  readonly htmlContent = input.required<string>();
  readonly jsContent = input.required<string>();
  readonly cssContent = input.required<string>();
  readonly vttContent = input.required<string>();
  readonly previewTitle = input.required<string>();

  readonly domReady = output<MessageEvent>();
  readonly axeResult = output<SandboxAxeViolation[]>();
  readonly axeError = output<string>();
  readonly interactionChange = output<void>();

  protected onDomReady(event: MessageEvent): void {
    this.domReady.emit(event);
  }

  protected onAxeResult(results: SandboxAxeViolation[]): void {
    this.axeResult.emit(results);
  }

  protected onAxeError(message: string): void {
    this.axeError.emit(message);
  }

  protected onInteractionChange(): void {
    this.interactionChange.emit();
  }
}
