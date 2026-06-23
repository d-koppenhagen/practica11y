import { render } from '@testing-library/angular';
import { Component, input, output, OutputEmitterRef } from '@angular/core';
import { DeferBlockState } from '@angular/core/testing';
import { PreviewPanel } from './preview-panel';
import { SandboxAxeViolation } from '@practica11y/sandbox';

@Component({
  selector: 'a11y-sandbox-preview',
  template: '',
})
class MockSandboxPreview {
  readonly htmlContent = input.required<string>();
  readonly jsContent = input<string>('');
  readonly cssContent = input<string>('');
  readonly vttContent = input<string>('');
  readonly previewTitle = input<string>('Preview');
  readonly domReady: OutputEmitterRef<MessageEvent> = output<MessageEvent>();
  readonly axeResult: OutputEmitterRef<SandboxAxeViolation[]> =
    output<SandboxAxeViolation[]>();
  readonly axeError: OutputEmitterRef<string> = output<string>();
  readonly interactionChange: OutputEmitterRef<void> = output<void>();
}

describe('PreviewPanel', () => {
  const defaultInputs = {
    htmlContent: '<h1>Hello</h1>',
    jsContent: 'console.log("hi")',
    cssContent: 'h1 { color: red }',
    vttContent: '',
    previewTitle: 'Test Preview',
  };

  async function setup(overrides: Partial<typeof defaultInputs> = {}) {
    return render(PreviewPanel, {
      inputs: { ...defaultInputs, ...overrides },
      componentImports: [MockSandboxPreview],
      deferBlockStates: DeferBlockState.Complete,
    });
  }

  describe('output event forwarding from SandboxPreview', () => {
    it('should forward domReady events from SandboxPreview', async () => {
      const onDomReady = vi.fn();
      const { fixture } = await render(PreviewPanel, {
        inputs: defaultInputs,
        componentImports: [MockSandboxPreview],
        deferBlockStates: DeferBlockState.Complete,
        on: { domReady: onDomReady },
      });

      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      const fakeEvent = new MessageEvent('message', {
        data: { type: 'dom-ready' },
      });
      mockInstance.domReady.emit(fakeEvent);
      expect(onDomReady).toHaveBeenCalledWith(fakeEvent);
    });

    it('should forward axeResult events from SandboxPreview', async () => {
      const onAxeResult = vi.fn();
      const { fixture } = await render(PreviewPanel, {
        inputs: defaultInputs,
        componentImports: [MockSandboxPreview],
        deferBlockStates: DeferBlockState.Complete,
        on: { axeResult: onAxeResult },
      });

      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      const fakeViolations: SandboxAxeViolation[] = [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must meet color contrast ratio thresholds',
          helpUrl: 'https://example.com',
          nodes: [
            {
              html: '<p>text</p>',
              target: ['p'],
              failureSummary: 'Fix contrast',
            },
          ],
        },
      ];
      mockInstance.axeResult.emit(fakeViolations);
      expect(onAxeResult).toHaveBeenCalledWith(fakeViolations);
    });

    it('should forward axeError events from SandboxPreview', async () => {
      const onAxeError = vi.fn();
      const { fixture } = await render(PreviewPanel, {
        inputs: defaultInputs,
        componentImports: [MockSandboxPreview],
        deferBlockStates: DeferBlockState.Complete,
        on: { axeError: onAxeError },
      });

      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      mockInstance.axeError.emit('axe-core failed to run');
      expect(onAxeError).toHaveBeenCalledWith('axe-core failed to run');
    });

    it('should forward interactionChange events from SandboxPreview', async () => {
      const onInteractionChange = vi.fn();
      const { fixture } = await render(PreviewPanel, {
        inputs: defaultInputs,
        componentImports: [MockSandboxPreview],
        deferBlockStates: DeferBlockState.Complete,
        on: { interactionChange: onInteractionChange },
      });

      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      mockInstance.interactionChange.emit();
      expect(onInteractionChange).toHaveBeenCalled();
    });
  });

  describe('SandboxPreview receives content inputs', () => {
    it('should pass htmlContent to SandboxPreview', async () => {
      const { fixture } = await setup({ htmlContent: '<p>Custom HTML</p>' });
      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      expect(mockInstance.htmlContent()).toBe('<p>Custom HTML</p>');
    });

    it('should pass jsContent to SandboxPreview', async () => {
      const { fixture } = await setup({ jsContent: 'alert("test")' });
      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      expect(mockInstance.jsContent()).toBe('alert("test")');
    });

    it('should pass cssContent to SandboxPreview', async () => {
      const { fixture } = await setup({ cssContent: 'body { margin: 0 }' });
      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      expect(mockInstance.cssContent()).toBe('body { margin: 0 }');
    });

    it('should pass vttContent to SandboxPreview', async () => {
      const { fixture } = await setup({
        vttContent: 'WEBVTT\n\n00:00.000 --> 00:01.000\nHello',
      });
      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      expect(mockInstance.vttContent()).toBe(
        'WEBVTT\n\n00:00.000 --> 00:01.000\nHello',
      );
    });

    it('should pass previewTitle to SandboxPreview', async () => {
      const { fixture } = await setup({ previewTitle: 'My Custom Title' });
      const mockSandbox = fixture.debugElement.query(
        (el) => el.name === 'a11y-sandbox-preview',
      );
      const mockInstance = mockSandbox.componentInstance as InstanceType<
        typeof MockSandboxPreview
      >;
      expect(mockInstance.previewTitle()).toBe('My Custom Title');
    });
  });
});
