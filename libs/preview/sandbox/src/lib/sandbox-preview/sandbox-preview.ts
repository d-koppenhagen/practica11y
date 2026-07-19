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
  readonly vttContent = input<string>('');
  readonly previewTitle = input<string>('Preview');
  readonly simulationCss = input<string>('');
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
    const vtt = this.vttContent();
    const theme = this.themeService.theme();
    const title = this.previewTitle();
    const simCss = this.simulationCss();
    return this.sanitizer.bypassSecurityTrustHtml(
      this.buildSrcdoc(html, js, css, vtt, theme, title, simCss),
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
    vtt: string,
    theme: 'light' | 'dark',
    title: string,
    simulationCss: string,
  ): string {
    const scrollbarThumb = theme === 'dark' ? '#4a5568' : '#cbd5e0';
    const scrollbarThumbHover = theme === 'dark' ? '#718096' : '#a0aec0';

    const userScript = js ? `\n  <script>${js}</script>` : '';

    // Script that creates a blob URL for the VTT content and patches all <track> elements
    // whose src ends in .vtt to use the blob URL instead. Also sets track mode to "showing"
    // so that cues are rendered visibly on the video.
    const vttScript = vtt
      ? `\n  <script>(function() {
    var vttContent = ${JSON.stringify(vtt)};
    var blob = new Blob([vttContent], { type: 'text/vtt' });
    var blobUrl = URL.createObjectURL(blob);
    document.querySelectorAll('track[src]').forEach(function(track) {
      if (track.getAttribute('src').endsWith('.vtt')) {
        track.setAttribute('src', blobUrl);
        track.track.mode = 'showing';
      }
    });
  })();</script>`
      : '';

    const simulationStyleBlock = simulationCss
      ? `\n  <style id="p11y-simulation">${simulationCss}</style>`
      : '';

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
  </style>${simulationStyleBlock}
  <style>
    ${css}
  </style>
</head>
<body>
  <div id="user-content">${html}</div>${vttScript}${userScript}
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
