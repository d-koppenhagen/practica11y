import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  DestroyRef,
  inject,
  afterNextRender,
  OutputEmitterRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '@practica11y/util';

/** Shape of an axe-core violation posted from the iframe. */
export interface SandboxAxeViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: { html: string; target: string[]; failureSummary: string }[];
}

@Component({
  selector: 'a11y-sandbox-preview',
  imports: [],
  templateUrl: './sandbox-preview.html',
  styleUrl: './sandbox-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxPreview {
  readonly htmlContent = input.required<string>();
  readonly jsContent = input<string>('');
  readonly cssContent = input<string>('');
  readonly previewTitle = input<string>('Preview');
  readonly domReady: OutputEmitterRef<MessageEvent> = output<MessageEvent>();
  readonly axeResult: OutputEmitterRef<SandboxAxeViolation[]> =
    output<SandboxAxeViolation[]>();
  readonly axeError: OutputEmitterRef<string> = output<string>();
  readonly interactionChange: OutputEmitterRef<void> = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeService = inject(ThemeService);
  private messageListener: ((event: MessageEvent) => void) | null = null;

  readonly srcdoc = computed<SafeHtml>(() => {
    const html = this.htmlContent();
    const js = this.jsContent();
    const css = this.cssContent();
    const theme = this.themeService.theme();
    const title = this.previewTitle();
    return this.sanitizer.bypassSecurityTrustHtml(
      this.buildSrcdoc(html, js, css, theme, title),
    );
  });

  constructor() {
    afterNextRender(() => {
      this.setupMessageListener();
    });

    this.destroyRef.onDestroy(() => {
      this.teardownMessageListener();
    });
  }

  private setupMessageListener(): void {
    this.messageListener = (event: MessageEvent) => {
      if (event.data?.type === 'dom-ready') {
        this.domReady.emit(event);
      } else if (event.data?.type === 'axe-result') {
        this.axeResult.emit(event.data.payload as SandboxAxeViolation[]);
      } else if (event.data?.type === 'axe-error') {
        this.axeError.emit(event.data.payload?.message ?? 'Unknown axe error');
      } else if (event.data?.type === 'interaction-change') {
        this.interactionChange.emit();
      }
    };
    window.addEventListener('message', this.messageListener);
  }

  private teardownMessageListener(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }

  private buildSrcdoc(
    html: string,
    js: string,
    css: string,
    theme: 'light' | 'dark',
    title: string,
  ): string {
    const scrollbarThumb = theme === 'dark' ? '#4a5568' : '#cbd5e0';
    const scrollbarThumbHover = theme === 'dark' ? '#718096' : '#a0aec0';

    const userScript = js ? `\n  <script>${js}</script>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(title)}</title>
  <style>
    html { background-color: #fff; }
    body { color-scheme: light; margin: 1rem; }
    * { scrollbar-color: ${scrollbarThumb} transparent; scrollbar-width: thin; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background-color: ${scrollbarThumb}; border-radius: 4px; border: 2px solid transparent; background-clip: content-box; }
    ::-webkit-scrollbar-thumb:hover { background-color: ${scrollbarThumbHover}; }
    ::-webkit-scrollbar-corner { background: transparent; }
    ${css}
  </style>
</head>
<body>
  <div id="user-content">${html}</div>${userScript}
  <script src="/assets/axe.min.js"></script>
  <script src="/assets/sandbox-analysis.js"></script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
