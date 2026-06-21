import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { generateSpokenPhrases } from './screen-reader-engine';
import { VirtualScreenReader } from './virtual-screen-reader';

@Component({
  selector: 'a11y-test-host',
  imports: [VirtualScreenReader],
  template: `<a11y-virtual-screen-reader
    [sandboxDocument]="doc()"
    [revision]="revision()"
  />`,
})
class TestHost {
  readonly doc = input<Document | null>(null);
  readonly revision = input<number>(0);
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
});
