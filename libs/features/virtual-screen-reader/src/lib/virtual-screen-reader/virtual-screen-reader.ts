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

import { generateSpokenPhrases } from './screen-reader-engine';

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
   * Playback rate (0.5–2). Exposed as a two-way model so the host can persist
   * and restore the user's preferred speed.
   */
  readonly rate = model<number>(1);

  private readonly destroyRef = inject(DestroyRef);

  protected readonly phrases = signal<string[]>([]);
  protected readonly currentIndex = signal<number>(-1);
  protected readonly isPlaying = signal<boolean>(false);
  protected readonly speechEnabled = signal<boolean>(true);
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

  constructor() {
    effect(() => {
      const doc = this.sandboxDocument();
      // Track the revision so in-place DOM mutations re-trigger generation.
      this.revision();
      void this.regenerate(doc);
    });

    // Keep the active phrase visible while stepping or auto-playing.
    effect(() => {
      this.currentIndex();
      const container = this.logRef()?.nativeElement;
      const active = container?.querySelector<HTMLElement>(
        '.vsr-log-item--active',
      );
      active?.scrollIntoView({ block: 'nearest' });
    });

    this.destroyRef.onDestroy(() => {
      this.pause();
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

  private async regenerate(doc: Document | null): Promise<void> {
    this.pause();
    const token = ++this.generationToken;

    if (!doc?.body) {
      this.phrases.set([]);
      this.currentIndex.set(-1);
      this.status.set('idle');
      return;
    }

    this.status.set('generating');

    try {
      const log = await generateSpokenPhrases(doc.body, doc.defaultView);
      if (token !== this.generationToken) {
        return;
      }
      this.phrases.set(log);
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
      this.phrases.set([]);
      this.currentIndex.set(-1);
      this.status.set('error');
    }
  }
}
