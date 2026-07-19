import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SafeHtml } from '@angular/platform-browser';
import { SandboxPreview } from './sandbox-preview';
import { ThemeService } from '@practica11y/util';
import { signal } from '@angular/core';

function unwrapSafeHtml(value: SafeHtml): string {
  return (value as { changingThisBreaksApplicationSecurity: string })
    .changingThisBreaksApplicationSecurity;
}

describe('SandboxPreview', () => {
  let component: SandboxPreview;
  let fixture: ComponentFixture<SandboxPreview>;
  const themeSignal = signal<'light' | 'dark'>('light');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxPreview],
      providers: [{ provide: ThemeService, useValue: { theme: themeSignal } }],
    }).compileComponents();

    themeSignal.set('light');
    fixture = TestBed.createComponent(SandboxPreview);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('htmlContent', '<p>test</p>');
    await fixture.whenStable();
  });

  describe('srcdoc generation', () => {
    it('should contain the HTML content in srcdoc', () => {
      fixture.componentRef.setInput('htmlContent', '<h1>Hello World</h1>');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('<h1>Hello World</h1>');
    });

    it('should wrap HTML content in a proper document structure', () => {
      const srcdoc = unwrapSafeHtml(component.srcdoc());

      expect(srcdoc).toContain('<!DOCTYPE html>');
      expect(srcdoc).toContain('<html lang="en">');
      expect(srcdoc).toContain('<head>');
      expect(srcdoc).toContain('<body>');
      expect(srcdoc).toContain('</html>');
    });

    it('should include script references for sandbox analysis', () => {
      const srcdoc = unwrapSafeHtml(component.srcdoc());

      expect(srcdoc).toContain('<script src="/assets/axe.min.js"></script>');
      expect(srcdoc).toContain(
        '<script src="/assets/sandbox-analysis.js"></script>',
      );
    });

    it('should update srcdoc when htmlContent input changes', () => {
      fixture.componentRef.setInput('htmlContent', '<div>first</div>');
      fixture.detectChanges();
      expect(unwrapSafeHtml(component.srcdoc())).toContain('<div>first</div>');

      fixture.componentRef.setInput('htmlContent', '<span>second</span>');
      fixture.detectChanges();
      expect(unwrapSafeHtml(component.srcdoc())).toContain(
        '<span>second</span>',
      );
      expect(unwrapSafeHtml(component.srcdoc())).not.toContain(
        '<div>first</div>',
      );
    });
  });

  describe('CSS injection', () => {
    it('should include CSS content in a style tag when cssContent is provided', () => {
      fixture.componentRef.setInput('cssContent', 'body { color: red; }');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('body { color: red; }');
    });

    it('should always use light color-scheme', () => {
      fixture.componentRef.setInput('cssContent', '');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('<style>');
      expect(srcdoc).toContain('color-scheme: light;');
      expect(srcdoc).toContain('scrollbar-color:');
    });

    it('should use light scrollbar colors when theme is light', () => {
      themeSignal.set('light');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('#cbd5e0');
    });

    it('should use dark scrollbar colors when theme is dark', () => {
      themeSignal.set('dark');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('#4a5568');
    });

    it('should update style content when cssContent changes', () => {
      fixture.componentRef.setInput('cssContent', '.a { margin: 0; }');
      fixture.detectChanges();
      expect(unwrapSafeHtml(component.srcdoc())).toContain('.a { margin: 0; }');

      fixture.componentRef.setInput('cssContent', '.b { padding: 10px; }');
      fixture.detectChanges();
      expect(unwrapSafeHtml(component.srcdoc())).toContain(
        '.b { padding: 10px; }',
      );
      expect(unwrapSafeHtml(component.srcdoc())).not.toContain(
        '.a { margin: 0; }',
      );
    });
  });

  describe('domReady event', () => {
    it('should emit domReady when a dom-ready message is received', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const emittedEvents: MessageEvent[] = [];
      const sub = component.domReady.subscribe((event) => {
        emittedEvents.push(event);
      });

      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'dom-ready' } }),
      );

      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].data.type).toBe('dom-ready');

      sub.unsubscribe();
    });

    it('should not emit domReady for messages with other types', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const emittedEvents: MessageEvent[] = [];
      const sub = component.domReady.subscribe((event) => {
        emittedEvents.push(event);
      });

      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'error' } }),
      );
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'other' } }),
      );
      window.dispatchEvent(
        new MessageEvent('message', { data: { someKey: 'value' } }),
      );

      expect(emittedEvents.length).toBe(0);

      sub.unsubscribe();
    });

    it('should not emit domReady for messages without data', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const emittedEvents: MessageEvent[] = [];
      const sub = component.domReady.subscribe((event) => {
        emittedEvents.push(event);
      });

      window.dispatchEvent(new MessageEvent('message', { data: null }));
      window.dispatchEvent(new MessageEvent('message', { data: undefined }));

      expect(emittedEvents.length).toBe(0);

      sub.unsubscribe();
    });
  });

  describe('simulation CSS injection', () => {
    it('should include simulation CSS in a style block when simulationCss is provided', () => {
      fixture.componentRef.setInput(
        'simulationCss',
        ':root { color-scheme: dark; }',
      );
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).toContain('<style id="p11y-simulation">');
      expect(srcdoc).toContain(':root { color-scheme: dark; }');
    });

    it('should omit simulation style block when simulationCss is empty', () => {
      fixture.componentRef.setInput('simulationCss', '');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      expect(srcdoc).not.toContain('p11y-simulation');
    });

    it('should place simulation CSS before user CSS in the output', () => {
      fixture.componentRef.setInput(
        'simulationCss',
        ':root { color-scheme: dark; }',
      );
      fixture.componentRef.setInput('cssContent', '.card { color: red; }');
      fixture.detectChanges();

      const srcdoc = unwrapSafeHtml(component.srcdoc());
      const simulationIndex = srcdoc.indexOf('p11y-simulation');
      const userCssIndex = srcdoc.indexOf('.card { color: red; }');
      expect(simulationIndex).toBeGreaterThan(-1);
      expect(userCssIndex).toBeGreaterThan(-1);
      expect(simulationIndex).toBeLessThan(userCssIndex);
    });
  });

  describe('sandbox attributes', () => {
    it('should have an iframe element', () => {
      fixture.detectChanges();

      const iframe = fixture.nativeElement.querySelector(
        'iframe',
      ) as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
    });

    it('should set sandbox attribute to allow scripts, same-origin, modals and forms', () => {
      fixture.detectChanges();

      const iframe = fixture.nativeElement.querySelector(
        'iframe',
      ) as HTMLIFrameElement;
      expect(iframe.getAttribute('sandbox')).toBe(
        'allow-scripts allow-same-origin allow-modals allow-forms',
      );
    });

    it('should have the correct title for accessibility', () => {
      fixture.detectChanges();

      const iframe = fixture.nativeElement.querySelector(
        'iframe',
      ) as HTMLIFrameElement;
      expect(iframe.getAttribute('title')).toBe('Live Preview');
    });

    it('should bind srcdoc to the iframe', () => {
      fixture.componentRef.setInput('htmlContent', '<p>iframe content</p>');
      fixture.detectChanges();

      const iframe = fixture.nativeElement.querySelector(
        'iframe',
      ) as HTMLIFrameElement;
      const srcdocAttr = iframe.getAttribute('srcdoc') ?? '';
      expect(srcdocAttr).toContain('<p>iframe content</p>');
      expect(srcdocAttr).toContain('<style>');
      expect(srcdocAttr).toContain(
        '<script src="/assets/sandbox-analysis.js"></script>',
      );
    });
  });
});
