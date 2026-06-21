import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { generateSpokenSteps, type SpokenStep } from './screen-reader-engine';

type PlayerStatus = 'idle' | 'generating' | 'ready' | 'empty' | 'error';

/** Minimum and maximum playback rate, matching the SpeechSynthesis range we expose. */
const MIN_RATE = 0.5;
const MAX_RATE = 2;

/** Base auto-play delay bounds (in ms) before the rate multiplier is applied. */
const MIN_DELAY = 900;
const MAX_DELAY = 4000;
const MS_PER_CHARACTER = 55;

/**
 * Simulates how a screen reader announces the Live Preview content. It computes
 * the spoken phrase log with Guidepup and lets the user step through it, play it
 * back once (stopping at the end) and control the playback speed. When available,
 * the phrases are also voiced through the Web Speech API.
 */
@Component({
  selector: 'a11y-virtual-screen-reader',
  templateUrl: './virtual-screen-reader.html',
  styleUrl: './virtual-screen-reader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualScreenReader {
  /** The preview document to announce. */
  readonly sandboxDocument = input<Document | null>(null);

  /**
   * Change token used to re-run the announcement when the document mutates in
   * place (without a reload), e.g. after an in-preview interaction.
   */
  readonly revision = input<number>(0);

  /**
   * Whether this tab is currently visible. The highlight overlay is only shown
   * when the component is active/visible to avoid visual noise while the user
   * is on a different tab.
   */
  readonly visible = input<boolean>(false);

  /**
   * Playback rate (0.5–2). Exposed as a two-way model so the host can persist
   * and restore the user's preferred speed.
   */
  readonly rate = model<number>(1);

  private readonly destroyRef = inject(DestroyRef);

  protected readonly steps = signal<SpokenStep[]>([]);
  protected readonly phrases = computed(() =>
    this.steps().map((step) => step.phrase),
  );
  protected readonly currentIndex = signal<number>(-1);
  protected readonly isPlaying = signal<boolean>(false);
  protected readonly speechEnabled = signal<boolean>(true);
  protected readonly highlightEnabled = signal<boolean>(true);
  protected readonly status = signal<PlayerStatus>('idle');

  protected readonly minRate = MIN_RATE;
  protected readonly maxRate = MAX_RATE;
  protected readonly rateStep = 0.25;

  protected readonly hasPhrases = computed(() => this.phrases().length > 0);

  protected readonly currentPhrase = computed(() => {
    const index = this.currentIndex();
    return index >= 0 ? (this.phrases()[index] ?? '') : '';
  });

  protected readonly positionLabel = computed(() => {
    const total = this.phrases().length;
    if (total === 0) {
      return '';
    }
    return `Step ${this.currentIndex() + 1} of ${total}`;
  });

  protected readonly rateLabel = computed(
    () =>
      `${this.rate()
        .toFixed(2)
        .replace(/\.?0+$/, '')}\u00d7`,
  );

  protected readonly speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  private readonly logRef = viewChild<ElementRef<HTMLElement>>('log');

  private autoPlayTimer: ReturnType<typeof setTimeout> | null = null;
  private generationToken = 0;

  /** Highlight overlay rendered inside the preview document, and its owner doc. */
  private highlightEl: HTMLElement | null = null;
  private highlightDoc: Document | null = null;

  /** Last document reference used to detect actual document swaps vs. revision bumps. */
  private lastDoc: Document | null = null;

  constructor() {
    effect(() => {
      const doc = this.sandboxDocument();

      // Subscribe to revision so the effect re-evaluates when it changes, but
      // only regenerate when the Document reference itself changes (i.e. code
      // was edited and the iframe reloaded). Revision bumps caused by in-preview
      // interactions (focus, input, DOM mutations) should never reset playback.
      this.revision();

      if (doc === this.lastDoc) {
        return;
      }
      this.lastDoc = doc;
      void this.regenerate(doc);
    });

    // Keep the active phrase visible while stepping or auto-playing.
    effect(() => {
      this.currentIndex();
      const container = this.logRef()?.nativeElement;
      const active = container?.querySelector<HTMLElement>(
        '.vsr-log-item--active',
      );
      active?.scrollIntoView?.({ block: 'nearest' });
    });

    // Highlight the announced element in the preview for the active step.
    effect(() => {
      const index = this.currentIndex();
      const isVisible = this.visible();
      const isEnabled = this.highlightEnabled();
      const node = this.steps()[index]?.node ?? null;

      if (!isVisible || !isEnabled) {
        this.hideHighlight();
        return;
      }

      this.updateHighlight(this.sandboxDocument(), node);
    });

    this.destroyRef.onDestroy(() => {
      this.pause();
      this.removeHighlight();
      this.generationToken++;
    });
  }

  protected goToNext(): void {
    if (!this.hasPhrases()) {
      return;
    }
    const last = this.phrases().length - 1;
    this.goTo(Math.min(this.currentIndex() + 1, last));
  }

  protected goToPrevious(): void {
    if (!this.hasPhrases()) {
      return;
    }
    this.goTo(Math.max(this.currentIndex() - 1, 0));
  }

  protected restart(): void {
    if (!this.hasPhrases()) {
      return;
    }
    this.goTo(0);
  }

  protected jumpTo(index: number): void {
    if (!this.hasPhrases()) {
      return;
    }
    this.goTo(index);
  }

  protected togglePlay(): void {
    if (!this.hasPhrases()) {
      return;
    }
    if (this.isPlaying()) {
      this.pause();
      return;
    }

    this.isPlaying.set(true);
    const last = this.phrases().length - 1;
    const current = this.currentIndex();
    const start = current < 0 || current >= last ? 0 : current;
    this.goTo(start);
  }

  protected onRateInput(value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.min(Math.max(parsed, MIN_RATE), MAX_RATE);
    this.rate.set(clamped);
    if (this.isPlaying()) {
      this.scheduleAdvance();
    }
  }

  protected toggleSpeech(): void {
    const next = !this.speechEnabled();
    this.speechEnabled.set(next);
    if (!next) {
      this.cancelSpeech();
    } else {
      this.speak(this.currentPhrase());
    }
  }

  protected toggleHighlight(): void {
    const next = !this.highlightEnabled();
    this.highlightEnabled.set(next);
    if (!next) {
      this.hideHighlight();
    }
  }

  private goTo(index: number): void {
    this.currentIndex.set(index);
    this.speak(this.phrases()[index] ?? '');
    if (this.isPlaying()) {
      this.scheduleAdvance();
    }
  }

  private scheduleAdvance(): void {
    this.clearTimer();
    const phrase = this.phrases()[this.currentIndex()] ?? '';
    const delay = this.computeDelay(phrase);
    const last = this.phrases().length - 1;
    this.autoPlayTimer = setTimeout(() => {
      // Stop once the last phrase has been announced; play does not loop.
      if (this.currentIndex() >= last) {
        this.pause();
        return;
      }
      this.goTo(this.currentIndex() + 1);
    }, delay);
  }

  private computeDelay(phrase: string): number {
    const base = Math.min(
      Math.max(phrase.length * MS_PER_CHARACTER, MIN_DELAY),
      MAX_DELAY,
    );
    return base / this.rate();
  }

  private pause(): void {
    this.isPlaying.set(false);
    this.clearTimer();
    this.cancelSpeech();
  }

  private clearTimer(): void {
    if (this.autoPlayTimer !== null) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private speak(text: string): void {
    if (!text || !this.speechEnabled() || !this.speechSupported) {
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(Math.max(this.rate(), MIN_RATE), MAX_RATE);
    synth.speak(utterance);
  }

  private cancelSpeech(): void {
    if (this.speechSupported) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Draws (or moves) the highlight overlay over the element announced for the
   * active step. The overlay lives in the preview document so it tracks the
   * content's own scroll position. It is appended to `body` — a sibling of the
   * sandbox's `#user-content` — so it never triggers the sandbox mutation
   * observer that would otherwise re-run generation and interrupt playback.
   */
  private updateHighlight(doc: Document | null, node: Node | null): void {
    // Drop a stale overlay if the preview document was swapped (full reload).
    if (this.highlightDoc && this.highlightDoc !== doc) {
      this.removeHighlight();
    }

    const element =
      node?.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : (node?.parentElement ?? null);

    // Ignore nodes that belong to a different (e.g. previous) document.
    if (!doc?.body || !element || element.ownerDocument !== doc) {
      this.hideHighlight();
      return;
    }

    const overlay = this.ensureHighlight(doc);
    if (!overlay) {
      return;
    }

    const view = doc.defaultView;
    const rect = element.getBoundingClientRect();
    const scrollX = view?.scrollX ?? 0;
    const scrollY = view?.scrollY ?? 0;

    overlay.style.display = 'block';
    overlay.style.top = `${rect.top + scrollY}px`;
    overlay.style.left = `${rect.left + scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  private ensureHighlight(doc: Document): HTMLElement | null {
    if (this.highlightEl && this.highlightDoc === doc) {
      return this.highlightEl;
    }
    if (!doc.body) {
      return null;
    }

    const overlay = doc.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset['p11ySrCursor'] = '';
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      margin: '0',
      padding: '0',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: '2147483647',
      border: '2px solid #4f46e5',
      outline: '2px solid rgba(255, 255, 255, 0.9)',
      borderRadius: '2px',
      backgroundColor: 'rgba(79, 70, 229, 0.15)',
      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.35)',
      display: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    // Animate position changes unless the user prefers reduced motion.
    const mql = doc.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    );
    const reduceMotion = mql?.matches ?? false;
    if (!reduceMotion) {
      overlay.style.transition =
        'top 0.12s ease, left 0.12s ease, width 0.12s ease, height 0.12s ease';
    }

    doc.body.appendChild(overlay);
    this.highlightEl = overlay;
    this.highlightDoc = doc;
    return overlay;
  }

  private hideHighlight(): void {
    if (this.highlightEl) {
      this.highlightEl.style.display = 'none';
    }
  }

  private removeHighlight(): void {
    this.highlightEl?.remove();
    this.highlightEl = null;
    this.highlightDoc = null;
  }

  private async regenerate(doc: Document | null): Promise<void> {
    this.pause();
    this.removeHighlight();
    const token = ++this.generationToken;

    if (!doc?.body) {
      this.steps.set([]);
      this.currentIndex.set(-1);
      this.status.set('idle');
      return;
    }

    this.status.set('generating');

    try {
      const log = await generateSpokenSteps(doc.body, doc.defaultView);
      if (token !== this.generationToken) {
        return;
      }
      this.steps.set(log);
      this.currentIndex.set(log.length > 0 ? 0 : -1);
      this.status.set(log.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      if (token !== this.generationToken) {
        return;
      }
      console.warn(
        '[VirtualScreenReader] Failed to generate spoken phrases:',
        error,
      );
      this.steps.set([]);
      this.currentIndex.set(-1);
      this.status.set('error');
    }
  }
}
