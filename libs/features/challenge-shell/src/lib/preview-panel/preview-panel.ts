import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  computed,
} from '@angular/core';
import { SandboxPreview, SandboxAxeViolation } from '@practica11y/sandbox';
import {
  PreferenceSimulationStore,
  extractSimulatedMediaRules,
} from '@practica11y/util';

@Component({
  selector: 'a11y-preview-panel',
  imports: [SandboxPreview],
  templateUrl: './preview-panel.html',
  styleUrl: './preview-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPanel {
  private readonly simulationStore = inject(PreferenceSimulationStore);

  /**
   * Combined simulation CSS: includes both the generic overrides (from buildSimulationCss)
   * and the extracted user media query rules that match the simulated preferences.
   */
  protected readonly simulationCss = computed(() => {
    // Early return if all preferences are at their defaults
    if (!this.simulationStore.hasOverrides()) return '';

    const baseCss = this.simulationStore.simulationCss();
    const userCss = this.cssContent();

    const extractedRules = extractSimulatedMediaRules(userCss, {
      reducedMotion: this.simulationStore.reducedMotion(),
      colorScheme: this.simulationStore.colorScheme(),
      contrast: this.simulationStore.contrast(),
    });

    // Combine base simulation CSS with extracted user rules
    const parts = [baseCss, extractedRules].filter(Boolean);
    return parts.join('\n');
  });

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
