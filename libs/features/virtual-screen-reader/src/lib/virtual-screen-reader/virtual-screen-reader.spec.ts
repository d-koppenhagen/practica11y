import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateSpokenPhrases,
  generateSpokenSteps,
} from './screen-reader-engine';
import { VirtualScreenReader } from './virtual-screen-reader';

@Component({
  selector: 'a11y-test-host',
  imports: [VirtualScreenReader],
  template: `<a11y-virtual-screen-reader
    [sandboxDocument]="doc()"
    [revision]="revision()"
    [visible]="visible()"
  />`,
})
class TestHost {
  readonly doc = input<Document | null>(null);
  readonly revision = input<number>(0);
  readonly visible = input<boolean>(true);
}

describe('generateSpokenPhrases', () => {
  it('collects spoken phrases and reaches the end of the document', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>Hello World</h1>
      <p>Some text</p>
      <button type="button">Submit</button>
    `;
    document.body.appendChild(container);

    try {
      // Mirror production usage: the engine is fed the document `body`, whose
      // root maps to the `document` role and therefore emits the terminating
      // `end of document` boundary phrase. A detached element never emits it.
      const phrases = await generateSpokenPhrases(document.body, window);

      expect(phrases.length).toBeGreaterThan(0);
      expect(phrases).toContain('end of document');
      expect(phrases.some((phrase) => phrase.includes('Hello World'))).toBe(
        true,
      );
    } finally {
      container.remove();
    }
  });
});

describe('generateSpokenSteps', () => {
  it('returns steps with node references alongside phrases', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>Heading</h1>
      <p>Paragraph</p>
    `;
    document.body.appendChild(container);

    try {
      const steps = await generateSpokenSteps(document.body, window);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[steps.length - 1].phrase).toBe('end of document');

      // At least one step should reference a real DOM node (not null).
      const withNode = steps.filter((s) => s.node !== null);
      expect(withNode.length).toBeGreaterThan(0);

      // Heading step should reference the h1 or its text node.
      const headingStep = steps.find((s) =>
        s.phrase.toLowerCase().includes('heading'),
      );
      expect(headingStep).toBeDefined();
      expect(headingStep!.node).not.toBeNull();
    } finally {
      container.remove();
    }
  });

  it('phrases from generateSpokenSteps match generateSpokenPhrases output', async () => {
    const container = document.createElement('div');
    container.innerHTML = `<button type="button">Click me</button>`;
    document.body.appendChild(container);

    try {
      const steps = await generateSpokenSteps(document.body, window);
      const phrases = await generateSpokenPhrases(document.body, window);

      expect(steps.map((s) => s.phrase)).toEqual(phrases);
    } finally {
      container.remove();
    }
  });
});

describe('VirtualScreenReader', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows the idle message when no document is provided', () => {
    const message = host.querySelector('.vsr-message');
    expect(message?.textContent).toContain('Run the preview');
  });

  it('exposes the playback controls group', () => {
    const group = host.querySelector('[aria-label="Virtual screen reader"]');
    expect(group).toBeTruthy();
  });

  it('renders highlight overlay into sandbox document during playback', async () => {
    // Create a minimal sandbox document (simulating an iframe's contentDocument).
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(
        '<html><body><main><h1>Title</h1><p>Content</p></main></body></html>',
      );
      iframeDoc.close();

      // Feed the sandbox document to the component via the test host input.
      fixture.componentRef.setInput('doc', iframeDoc);
      fixture.detectChanges();

      // Wait for generation to complete (status transitions to 'ready').
      await fixture.whenStable();
      // Allow effects and microtasks to flush.
      await new Promise((resolve) => setTimeout(resolve, 200));
      fixture.detectChanges();

      // The highlight overlay should be present in the iframe document body.
      const overlay = iframeDoc.querySelector('[data-p11y-sr-cursor]');
      expect(overlay).not.toBeNull();
      expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    } finally {
      iframe.remove();
    }
  });
});

/**
 * A controllable stand-in for the Web Speech API. jsdom provides no
 * `speechSynthesis`, and even where it exists it speaks asynchronously with
 * real timing. This mock records spoken phrases and lets the test fire the
 * `end` event manually, so the auto-play advance can be asserted
 * deterministically.
 */
class FakeSpeechSynthesis {
  readonly spoken: string[] = [];
  cancelCount = 0;

  private queue: FakeUtterance[] = [];

  speak(utterance: FakeUtterance): void {
    this.spoken.push(utterance.text);
    this.queue.push(utterance);
  }

  cancel(): void {
    this.cancelCount++;
    this.queue = [];
  }

  /** Simulates the browser finishing the most recently spoken utterance. */
  finishCurrent(): void {
    const utterance = this.queue.shift();
    utterance?.onend?.(new Event('end'));
  }
}

class FakeUtterance {
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  rate = 1;
  constructor(readonly text: string) {}
}

describe('VirtualScreenReader auto-play advance', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: HTMLElement;
  let synth: FakeSpeechSynthesis;
  let iframe: HTMLIFrameElement;
  let originalSynth: PropertyDescriptor | undefined;
  let originalUtterance: PropertyDescriptor | undefined;

  const playButton = () =>
    host.querySelector<HTMLButtonElement>('.vsr-btn--primary');
  const position = () =>
    host.querySelector('.vsr-position')?.textContent?.trim() ?? '';

  beforeEach(async () => {
    vi.useFakeTimers();

    synth = new FakeSpeechSynthesis();
    originalSynth = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
    originalUtterance = Object.getOwnPropertyDescriptor(
      window,
      'SpeechSynthesisUtterance',
    );
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeUtterance,
    });

    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.nativeElement;
    fixture.detectChanges();

    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(
      '<html><body><main><h1>First heading</h1><p>Some paragraph text</p><button type="button">Submit</button></main></body></html>',
    );
    doc.close();

    fixture.componentRef.setInput('doc', doc);
    fixture.detectChanges();

    // Flush the async phrase generation (a resolved promise, not a timer).
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(playButton()).not.toBeNull();
    });
  });

  afterEach(() => {
    // Destroy the fixture while the speech mock is still installed so the
    // component's teardown (pause -> cancelSpeech) sees a valid API.
    fixture.destroy();
    iframe.remove();
    if (originalSynth) {
      Object.defineProperty(window, 'speechSynthesis', originalSynth);
    } else {
      delete (window as unknown as Record<string, unknown>)['speechSynthesis'];
    }
    if (originalUtterance) {
      Object.defineProperty(
        window,
        'SpeechSynthesisUtterance',
        originalUtterance,
      );
    } else {
      delete (window as unknown as Record<string, unknown>)[
        'SpeechSynthesisUtterance'
      ];
    }
    vi.useRealTimers();
  });

  it('does not advance to the next phrase before speech finishes', () => {
    playButton()!.click();
    fixture.detectChanges();

    const firstPosition = position();
    const spokenBefore = synth.spoken.length;
    expect(firstPosition).toContain('Step 1');
    expect(spokenBefore).toBe(1);

    // Let every pending timer fire. The estimated fallback timer must NOT
    // advance playback while speech is driving it — this is the regression
    // the fix addresses (phrases were cut off mid-sentence).
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();

    expect(position()).toBe(firstPosition);
    expect(synth.spoken.length).toBe(spokenBefore);
  });

  it('advances to the next phrase when speech ends', () => {
    playButton()!.click();
    fixture.detectChanges();
    expect(position()).toContain('Step 1');

    synth.finishCurrent();
    fixture.detectChanges();

    expect(position()).toContain('Step 2');
    expect(synth.spoken.length).toBe(2);
  });

  it('reads each phrase to completion through the whole log', () => {
    playButton()!.click();
    fixture.detectChanges();

    const total = host.querySelectorAll('.vsr-log-item').length;
    expect(total).toBeGreaterThan(1);

    // Finishing one utterance at a time should step through every phrase
    // exactly once without skipping any.
    for (let i = 1; i < total; i++) {
      expect(synth.spoken.length).toBe(i);
      synth.finishCurrent();
      fixture.detectChanges();
    }

    expect(synth.spoken.length).toBe(total);
    expect(position()).toContain(`Step ${total}`);

    // Playback stops at the end; a further end event does not loop.
    synth.finishCurrent();
    fixture.detectChanges();
    expect(synth.spoken.length).toBe(total);
    expect(playButton()!.getAttribute('aria-pressed')).toBe('false');
  });
});
