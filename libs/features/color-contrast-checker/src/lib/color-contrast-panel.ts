import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { ColorPickResult } from '@practica11y/types';

import {
  calculateContrastRatio,
  formatContrastRatio,
  rgbToHex,
  isLargeText,
  getWcagConformance,
} from './contrast-calculator';

@Component({
  selector: 'a11y-color-contrast-panel',
  templateUrl: './color-contrast-panel.html',
  styleUrl: './color-contrast-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorContrastPanel {
  private readonly destroyRef = inject(DestroyRef);

  /** Reference to the sandbox iframe for posting messages. */
  readonly sandboxIframe = input<HTMLIFrameElement | null>(null);

  /** Whether the color picker mode is currently active. */
  protected readonly pickerActive = signal(false);

  /** The last received color pick result from the iframe. */
  protected readonly colorResult = signal<ColorPickResult | null>(null);

  /** The calculated contrast ratio between foreground and background. */
  protected readonly contrastRatio = signal<number | null>(null);

  /** Error message when color parsing or calculation fails. */
  protected readonly errorState = signal<string | null>(null);

  /** Formatted contrast ratio as "X.XX:1". */
  protected readonly formattedRatio = computed(() => {
    const ratio = this.contrastRatio();
    if (ratio === null) return null;
    return formatContrastRatio(ratio);
  });

  /** Whether the selected element qualifies as large text per WCAG. */
  protected readonly isLargeText = computed(() => {
    const result = this.colorResult();
    if (!result) return false;
    return isLargeText(result.fontSizePx, result.fontWeight);
  });

  /** WCAG conformance results (AA/AAA normal/large). */
  protected readonly conformance = computed(() => {
    const ratio = this.contrastRatio();
    if (ratio === null) return null;
    return getWcagConformance(ratio);
  });

  /** Foreground color as hex string. */
  protected readonly foregroundHex = computed(() => {
    const result = this.colorResult();
    if (!result) return null;
    try {
      return rgbToHex(result.foregroundColor);
    } catch {
      return null;
    }
  });

  /** Background color as hex string. */
  protected readonly backgroundHex = computed(() => {
    const result = this.colorResult();
    if (!result) return null;
    try {
      return rgbToHex(result.backgroundColor);
    } catch {
      return null;
    }
  });

  private readonly messageHandler = (event: MessageEvent): void => {
    this.handleMessage(event);
  };

  constructor() {
    window.addEventListener('message', this.messageHandler);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('message', this.messageHandler);
    });
  }

  /** Toggle the color picker mode and send the appropriate message to the iframe. */
  protected togglePicker(): void {
    const newState = !this.pickerActive();
    this.pickerActive.set(newState);

    const iframe = this.sandboxIframe();
    if (iframe?.contentWindow) {
      const messageType = newState
        ? 'enable-color-picker'
        : 'disable-color-picker';
      iframe.contentWindow.postMessage({ type: messageType }, '*');
    }
  }

  private handleMessage(event: MessageEvent): void {
    const data = event.data;
    if (!data || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'color-pick-result':
        this.handleColorPickResult(data.payload);
        break;
      case 'dom-ready':
        this.handleDomReady();
        break;
    }
  }

  private handleColorPickResult(payload: unknown): void {
    if (!this.isValidColorPickPayload(payload)) return;

    const result: ColorPickResult = {
      foregroundColor: payload.foregroundColor,
      backgroundColor: payload.backgroundColor,
      fontSizePx: payload.fontSizePx,
      fontWeight: payload.fontWeight,
    };

    this.pickerActive.set(false);
    this.colorResult.set(result);
    this.errorState.set(null);

    try {
      const ratio = calculateContrastRatio(
        result.foregroundColor,
        result.backgroundColor,
      );
      this.contrastRatio.set(ratio);
    } catch {
      this.contrastRatio.set(null);
      this.errorState.set(
        'Could not calculate contrast ratio. The color values could not be parsed.',
      );
    }
  }

  private handleDomReady(): void {
    this.pickerActive.set(false);
    this.colorResult.set(null);
    this.contrastRatio.set(null);
    this.errorState.set(null);
  }

  private isValidColorPickPayload(
    payload: unknown,
  ): payload is ColorPickResult {
    if (!payload || typeof payload !== 'object') return false;
    const p = payload as Record<string, unknown>;
    return (
      typeof p['foregroundColor'] === 'string' &&
      typeof p['backgroundColor'] === 'string' &&
      typeof p['fontSizePx'] === 'number' &&
      typeof p['fontWeight'] === 'number'
    );
  }
}
