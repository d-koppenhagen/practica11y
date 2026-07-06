import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Challenge } from '@practica11y/models';
import { AccessibilityNode, AnalysisPipelineResult } from '@practica11y/types';
import { SandboxAxeViolation } from '@practica11y/sandbox';
import { ProgressStore } from '@practica11y/util';
import { MarkdownContent } from '@practica11y/ui';

import { ChallengeShell } from './challenge-shell';
import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellLayout } from '../shell-layout';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { EditorTabs } from '../editor-tabs/editor-tabs';
import { InvestigationToolTabs } from '../investigation-tool-tabs/investigation-tool-tabs';
import { FeedbackPanel } from '../feedback-panel/feedback-panel';
import { PreviewPanel } from '../preview-panel/preview-panel';

// --- Stub components ---

/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: 'ng-catbee-monaco-editor',
  standalone: true,
  template: '<div class="mock-monaco"></div>',
})
class MockCatbeeMonacoEditor {
  readonly language = input<string>('');
  readonly options = input<Record<string, unknown>>({});
  readonly height = input<string>('100%');
  readonly width = input<string>('100%');
  readonly value = model<string>('');
}

@Component({
  selector: 'ng-catbee-monaco-diff-editor',
  standalone: true,
  template: '<div class="mock-diff-editor"></div>',
})
class MockCatbeeMonacoDiffEditor {
  readonly model = input<{ original: string; modified: string }>();
  readonly language = input<string>('');
  readonly options = input<Record<string, unknown>>({});
  readonly originalEditable = input<boolean>(true);
  readonly height = input<string>('300px');
  readonly width = input<string>('100%');
  readonly editorDiffUpdate = output<{ original: string; modified: string }>();
}
/* eslint-enable @angular-eslint/component-selector */

@Component({
  selector: 'a11y-sandbox-preview',
  standalone: true,
  template: '<iframe title="Live Preview"></iframe>',
})
class MockSandboxPreview {
  readonly htmlContent = input.required<string>();
  readonly jsContent = input<string>('');
  readonly cssContent = input<string>('');
  readonly vttContent = input<string>('');
  readonly previewTitle = input<string>('Preview');
  readonly domReady = output<MessageEvent>();
  readonly axeResult = output<SandboxAxeViolation[]>();
  readonly axeError = output<string>();
}

@Component({
  selector: 'a11y-accessibility-tree',
  standalone: true,
  template: '<div class="mock-a11y-tree"></div>',
})
class MockAccessibilityTree {
  readonly tree = input<AccessibilityNode | null>(null);
  readonly pageTitle = input<string | null>(null);
}

@Component({
  selector: 'a11y-challenge-feedback',
  standalone: true,
  template: '<div class="mock-feedback"></div>',
})
class MockChallengeFeedback {
  readonly result = input<AnalysisPipelineResult | null>(null);
}

@Component({
  selector: 'a11y-cheat-animation',
  standalone: true,
  template: '<div class="mock-cheat-animation"></div>',
})
class MockCheatAnimation {
  readonly trigger = input(false);
  readonly animationComplete = output<void>();
}

@Component({
  selector: 'a11y-editor-actions',
  standalone: true,
  template: '<div class="mock-editor-actions"></div>',
})
class MockEditorActions {
  readonly hasSolution = input(false);
  readonly solutionRevealed = input(false);
  readonly hasUserSnapshot = input(false);
  readonly isPeeked = input(false);
  readonly challengeTitle = input('');
  readonly revealSolution = output<void>();
  readonly resetToStarter = output<void>();
  readonly restoreUserCode = output<void>();
}

@Component({
  selector: 'a11y-virtual-screen-reader',
  standalone: true,
  template: '<div class="mock-virtual-screen-reader"></div>',
})
class MockVirtualScreenReader {
  readonly sandboxDocument = input<Document | null>(null);
  readonly revision = input<number>(0);
  readonly visible = input<boolean>(false);
  readonly rate = model<number>(1);
  readonly speechEnabled = model<boolean>(true);
  readonly highlightEnabled = model<boolean>(true);
}

@Component({
  selector: 'a11y-color-contrast-panel',
  standalone: true,
  template: '<div class="mock-color-contrast-panel"></div>',
})
class MockColorContrastPanel {
  readonly sandboxIframe = input<HTMLIFrameElement | null>(null);
}

// --- Mock AnalysisPipeline ---

class MockAnalysisPipeline {
  readonly analysisResult = signal<AnalysisPipelineResult | null>(null);
  readonly isAnalyzing = signal<boolean>(false);
  readonly debouncedCodeChange = signal({
    htmlContent: '',
    jsContent: '',
    cssContent: '',
  });

  setChallenge = vi.fn();
  setSandboxDocument = vi.fn();
  updateCode = vi.fn();
  runLocalAnalysis = vi.fn().mockResolvedValue(undefined);
  runTreeAnalysis = vi.fn();
  runValidation = vi.fn().mockResolvedValue(undefined);
  setAxeResults = vi.fn().mockResolvedValue(undefined);
  runPipeline = vi.fn().mockResolvedValue(undefined);
}

// --- Test data ---

const mockChallenge: Challenge = {
  id: 'test-challenge',
  title: 'Test Challenge',
  difficulty: 'beginner',
  tags: ['semantics'],
  points: 100,
  description: '<p>Fix the accessibility issue below.</p>',
  starter: {
    html: '<div onclick="alert()">Click me</div>',
    js: '',
    css: 'div { color: red; }',
    vtt: '',
  },
  validatorIds: ['axe-no-violations'],
  previewTitle: 'Challenge: Test Challenge | Preview',
  links: [],
};

describe('ChallengeShell - Diff Toggle', () => {
  let fixture: ComponentFixture<ChallengeShell>;
  let component: ChallengeShell;
  let mockPipeline: MockAnalysisPipeline;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    if (!globalThis.IntersectionObserver) {
      globalThis.IntersectionObserver = class IntersectionObserver {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback(
            [{ isIntersecting: true, target } as IntersectionObserverEntry],
            this as unknown as globalThis.IntersectionObserver,
          );
        }
        unobserve() {
          /* noop */
        }
        disconnect() {
          /* noop */
        }
      } as unknown as typeof globalThis.IntersectionObserver;
    }

    mockPipeline = new MockAnalysisPipeline();

    await TestBed.configureTestingModule({
      imports: [ChallengeShell],
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    })
      .overrideComponent(ChallengeShell, {
        set: {
          imports: [
            MockCatbeeMonacoEditor,
            MockAccessibilityTree,
            MockVirtualScreenReader,
            MockColorContrastPanel,
            MockCatbeeMonacoDiffEditor,
            ShellPanel,
            ShellResizer,
            EditorTabs,
            MockEditorActions,
            InvestigationToolTabs,
            FeedbackPanel,
            PreviewPanel,
            MarkdownContent,
          ],
          providers: [
            { provide: AnalysisPipeline, useValue: mockPipeline },
            ShellLayout,
          ],
        },
      })
      .overrideComponent(FeedbackPanel, {
        set: {
          imports: [MockChallengeFeedback],
        },
      })
      .overrideComponent(PreviewPanel, {
        set: {
          imports: [MockSandboxPreview],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChallengeShell);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('challenge', mockChallenge);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Toggle button initial state', () => {
    it('should render the diff toggle switch with aria-checked="false" initially', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));
      expect(toggle).toBeTruthy();
      expect(toggle.nativeElement.getAttribute('aria-checked')).toBe('false');
    });

    it('should have accessible label "Toggle diff view"', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));
      expect(toggle.nativeElement.getAttribute('aria-label')).toBe(
        'Toggle diff view',
      );
    });
  });

  describe('Toggle button activation', () => {
    it('should switch aria-checked to "true" when clicked', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));
      toggle.nativeElement.click();
      fixture.detectChanges();

      expect(toggle.nativeElement.getAttribute('aria-checked')).toBe('true');
    });

    it('should switch aria-checked back to "false" when clicked again', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));

      // Activate diff view
      toggle.nativeElement.click();
      fixture.detectChanges();
      expect(toggle.nativeElement.getAttribute('aria-checked')).toBe('true');

      // Deactivate diff view
      toggle.nativeElement.click();
      fixture.detectChanges();
      expect(toggle.nativeElement.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Editor tabs visibility', () => {
    it('should always show editor tabs regardless of diff view state', () => {
      const editorTabs = fixture.debugElement.query(By.css('a11y-editor-tabs'));
      expect(editorTabs).toBeTruthy();
      expect(editorTabs.nativeElement.hidden).toBe(false);
    });

    it('should keep editor tabs visible when diff view is active', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));
      toggle.nativeElement.click();
      fixture.detectChanges();

      const editorTabs = fixture.debugElement.query(By.css('a11y-editor-tabs'));
      expect(editorTabs.nativeElement.hidden).toBe(false);
    });
  });

  describe('View mode announcement', () => {
    it('should announce "Switched to diff view" when toggle activates diff view', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));
      toggle.nativeElement.click();
      fixture.detectChanges();

      const liveRegion = fixture.debugElement.query(
        By.css('[aria-live="polite"].sr-only'),
      );
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.nativeElement.textContent.trim()).toContain(
        'Switched to diff view',
      );
    });

    it('should announce "Switched to code editor" when toggle deactivates diff view', () => {
      const toggle = fixture.debugElement.query(By.css('.diff-toggle-switch'));

      // Activate
      toggle.nativeElement.click();
      fixture.detectChanges();

      // Deactivate
      toggle.nativeElement.click();
      fixture.detectChanges();

      const liveRegion = fixture.debugElement.query(
        By.css('[aria-live="polite"].sr-only'),
      );
      expect(liveRegion.nativeElement.textContent.trim()).toContain(
        'Switched to code editor',
      );
    });
  });
});
