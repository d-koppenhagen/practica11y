import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
