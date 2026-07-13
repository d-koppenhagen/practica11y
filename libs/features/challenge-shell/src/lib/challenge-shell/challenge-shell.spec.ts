import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Challenge } from '@practica11y/models';
import {
  AccessibilityNode,
  AnalysisPipelineResult,
  AxeViolation,
} from '@practica11y/types';
import { SandboxAxeViolation } from '@practica11y/sandbox';

import { ProgressStore } from '@practica11y/util';

import { ChallengeShell } from './challenge-shell';
import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellLayout } from '../shell-layout';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { Confetti } from '../confetti/confetti';
import { EditorTabs } from '../editor-tabs/editor-tabs';
import { InvestigationToolTabs } from '../investigation-tool-tabs/investigation-tool-tabs';
import { FeedbackPanel } from '../feedback-panel/feedback-panel';
import { PreviewPanel } from '../preview-panel/preview-panel';
import { ChallengeMetaBar, MarkdownContent } from '@practica11y/ui';

// --- Stub components ---

/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: 'ng-catbee-monaco-editor',
  standalone: true,
  template: '<div class="mock-monaco"></div>',
})
/* eslint-enable @angular-eslint/component-selector */
class MockCatbeeMonacoEditor {
  readonly language = input<string>('');
  readonly options = input<Record<string, unknown>>({});
  readonly autoFormat = input<boolean>(true);
  readonly height = input<string>('100%');
  readonly width = input<string>('100%');
  readonly value = model<string>('');
}

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
  readonly focusedElement = input<Element | null>(null);
  readonly rate = model<number>(1);
  readonly speechEnabled = model<boolean>(true);
  readonly highlightEnabled = model<boolean>(true);
  readonly tabOrderEnabled = model<boolean>(false);
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
  createdAt: '2026-06-18',
};

describe('ChallengeShell', () => {
  let fixture: ComponentFixture<ChallengeShell>;
  let component: ChallengeShell;
  let mockPipeline: MockAnalysisPipeline;

  beforeEach(async () => {
    // Mock window.matchMedia for ThemeService
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

    // Mock IntersectionObserver for @defer (on viewport) blocks
    if (!globalThis.IntersectionObserver) {
      globalThis.IntersectionObserver = class IntersectionObserver {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          // Immediately trigger as intersecting so deferred blocks render
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
            ShellPanel,
            ShellResizer,
            Confetti,
            EditorTabs,
            MockEditorActions,
            InvestigationToolTabs,
            FeedbackPanel,
            PreviewPanel,
            MarkdownContent,
            ChallengeMetaBar,
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

    // Render all @defer blocks to their complete state for testing
    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the challenge title', () => {
    const heading = fixture.debugElement.query(By.css('#description-heading'));
    expect(heading.nativeElement.textContent).toContain('Test Challenge');
  });

  it('should render the challenge description as innerHTML', () => {
    const descSection = fixture.debugElement.query(
      By.css(
        '[aria-labelledby="description-heading"] .shell-description-content',
      ),
    );
    expect(descSection.nativeElement.innerHTML).toContain(
      'Fix the accessibility issue below.',
    );
  });

  it('should render editor tab buttons', () => {
    const tabs = fixture.debugElement.queryAll(
      By.css('[aria-label="Editor language"] [role="tab"]'),
    );
    expect(tabs.length).toBe(2);
    expect(tabs[0].nativeElement.textContent.trim()).toBe('HTML');
    expect(tabs[1].nativeElement.textContent.trim()).toBe('CSS');
  });

  it('should render the preview section', () => {
    const preview = fixture.debugElement.query(
      By.css('[aria-labelledby="preview-heading"]'),
    );
    expect(preview).toBeTruthy();
  });

  it('should render the accessibility tree section', () => {
    const treeSection = fixture.debugElement.query(
      By.css('[aria-labelledby="a11y-tree-heading"]'),
    );
    expect(treeSection).toBeTruthy();
  });

  it('should render the feedback section', () => {
    const feedback = fixture.debugElement.query(
      By.css('[aria-labelledby="feedback-heading"]'),
    );
    expect(feedback).toBeTruthy();
  });

  it('should show loading indicator when isAnalyzing is true', () => {
    // feedbackVisible must be true for feedbackState to be 'loading'
    (
      component as unknown as { feedbackVisible: { set: (v: boolean) => void } }
    ).feedbackVisible.set(true);
    mockPipeline.isAnalyzing.set(true);
    fixture.detectChanges();

    const feedbackSection = fixture.debugElement.query(
      By.css('[aria-labelledby="feedback-heading"]'),
    );
    const loader = feedbackSection.query(By.css('[role="status"]'));
    expect(loader).toBeTruthy();
    expect(loader.nativeElement.textContent).toContain('Analyzing');
  });

  it('should not show loading indicator when isAnalyzing is false', () => {
    mockPipeline.isAnalyzing.set(false);
    fixture.detectChanges();

    const feedbackSection = fixture.debugElement.query(
      By.css('[aria-labelledby="feedback-heading"]'),
    );
    const loader = feedbackSection.query(By.css('[role="status"]'));
    expect(loader).toBeFalsy();
  });

  it('should provide AnalysisPipeline at the component level', () => {
    // The component provides AnalysisPipeline - verify it was injected
    expect(mockPipeline.setChallenge).toHaveBeenCalled();
  });

  it('should switch active editor tab when clicking CSS tab', () => {
    const tablist = fixture.debugElement.query(
      By.css('[aria-label="Editor language"]'),
    );
    const tabs = tablist.queryAll(By.css('[role="tab"]'));
    const cssTab = tabs.find(
      (t) => t.nativeElement.textContent.trim() === 'CSS',
    )!;
    cssTab.nativeElement.click();
    fixture.detectChanges();

    expect(cssTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    const htmlTab = tabs.find(
      (t) => t.nativeElement.textContent.trim() === 'HTML',
    )!;
    expect(htmlTab.nativeElement.getAttribute('aria-selected')).toBe('false');
  });

  it('should call setSandboxDocument and runTreeAnalysis with non-null document on domReady', () => {
    mockPipeline.setSandboxDocument.mockClear();
    mockPipeline.runTreeAnalysis.mockClear();

    // Call onDomReady (protected, but accessible at runtime)
    (component as unknown as { onDomReady: () => void }).onDomReady();

    // runTreeAnalysis should be called with the sandbox document
    expect(mockPipeline.setSandboxDocument).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(mockPipeline.runTreeAnalysis).toHaveBeenCalledWith(
      expect.any(Object),
    );

    // Verify the argument passed is a Document-like object (non-null)
    const docArg = mockPipeline.setSandboxDocument.mock.calls[0][0];
    expect(docArg).not.toBeNull();
    expect(docArg).toBeDefined();
    expect(docArg.nodeType).toBe(9); // Node.DOCUMENT_NODE
    expect(docArg.documentElement).toBeDefined();
  });

  it('should render the "Open in new tab" button', () => {
    const btn = fixture.debugElement.query(By.css('.preview-open-btn'));
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.getAttribute('aria-label')).toBe(
      'Open preview in new tab',
    );
  });

  it('should call setAxeResults when onAxeResult is triggered', () => {
    mockPipeline.setAxeResults.mockClear();
    const violations: AxeViolation[] = [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
        nodes: [
          { html: '<p>text</p>', target: ['p'], failureSummary: 'Fix it' },
        ],
      },
    ];

    (
      component as unknown as { onAxeResult: (r: AxeViolation[]) => void }
    ).onAxeResult(violations);

    expect(mockPipeline.setAxeResults).toHaveBeenCalledWith(violations);
  });

  describe('Pipeline signal update flow', () => {
    const mockResult: AnalysisPipelineResult = {
      validationResults: [
        {
          id: 'axe-no-violations',
          passed: true,
          message: 'No violations found',
        } as never,
      ],
      accessibilityAnalysis: {
        axeResults: [],
        treeNodes: {
          role: 'document',
          name: 'Test Page',
          children: [
            { role: 'heading', name: 'Hello', level: 1, children: [] },
            { role: 'paragraph', name: 'Content', children: [] },
          ],
        },
        keyboardResults: {
          focusableElements: [],
          tabOrder: [],
          nonFocusableInteractive: [],
        },
        focusResults: {
          focusTraps: [],
          hiddenFocusable: [],
          focusOrder: [],
        },
      },
      challengeCompleted: false,
      timestamp: Date.now(),
    };

    it('should call updateCode when onHtmlContentChange is triggered', () => {
      mockPipeline.updateCode.mockClear();

      (
        component as unknown as { onHtmlContentChange: (c: string) => void }
      ).onHtmlContentChange('<h1>Updated content</h1>');

      expect(mockPipeline.updateCode).toHaveBeenCalledWith(
        '<h1>Updated content</h1>',
        mockChallenge.starter.js,
        mockChallenge.starter.css,
      );
    });

    it('should call runTreeAnalysis when onDomReady is triggered after code change', () => {
      mockPipeline.updateCode.mockClear();
      mockPipeline.runTreeAnalysis.mockClear();
      mockPipeline.setSandboxDocument.mockClear();

      // Step 1: Simulate code change
      (
        component as unknown as { onHtmlContentChange: (c: string) => void }
      ).onHtmlContentChange('<button>Click me</button>');

      expect(mockPipeline.updateCode).toHaveBeenCalledWith(
        '<button>Click me</button>',
        mockChallenge.starter.js,
        mockChallenge.starter.css,
      );

      // Step 2: Simulate domReady (iframe finished rendering)
      (component as unknown as { onDomReady: () => void }).onDomReady();

      // runTreeAnalysis should be called with the sandbox document
      expect(mockPipeline.runTreeAnalysis).toHaveBeenCalled();
    });

    it('should reactively update AccessibilityTree when analysisResult signal changes', () => {
      // Update the analysisResult signal with mock data
      mockPipeline.analysisResult.set(mockResult);
      fixture.detectChanges();

      // Find the AccessibilityTree component and verify its tree input
      const treeDebugEl = fixture.debugElement.query(
        By.directive(MockAccessibilityTree),
      );
      expect(treeDebugEl).toBeTruthy();

      const treeComponent =
        treeDebugEl.componentInstance as MockAccessibilityTree;
      expect(treeComponent.tree()).toEqual(
        mockResult.accessibilityAnalysis.treeNodes,
      );
    });

    it('should reactively update ChallengeFeedback when analysisResult signal changes', async () => {
      // feedbackVisible must be true and isAnalyzing false for feedbackState === 'results'
      (
        component as unknown as {
          feedbackVisible: { set: (v: boolean) => void };
        }
      ).feedbackVisible.set(true);
      mockPipeline.isAnalyzing.set(false);

      // Update the analysisResult signal with mock data
      mockPipeline.analysisResult.set(mockResult);
      fixture.detectChanges();

      // Find the ChallengeFeedback component and verify its result input
      const feedbackDebugEl = fixture.debugElement.query(
        By.directive(MockChallengeFeedback),
      );
      expect(feedbackDebugEl).toBeTruthy();

      const feedbackComponent =
        feedbackDebugEl.componentInstance as MockChallengeFeedback;
      expect(feedbackComponent.result()).toEqual(mockResult);
    });

    it('should complete end-to-end flow: code change → domReady → pipeline → reactive re-render', async () => {
      mockPipeline.updateCode.mockClear();
      mockPipeline.runTreeAnalysis.mockClear();
      mockPipeline.setSandboxDocument.mockClear();

      // Step 1: Simulate code change
      (
        component as unknown as { onHtmlContentChange: (c: string) => void }
      ).onHtmlContentChange('<main><h1>Accessible Page</h1></main>');

      expect(mockPipeline.updateCode).toHaveBeenCalledWith(
        '<main><h1>Accessible Page</h1></main>',
        mockChallenge.starter.js,
        mockChallenge.starter.css,
      );

      // Step 2: Simulate domReady
      (component as unknown as { onDomReady: () => void }).onDomReady();

      expect(mockPipeline.setSandboxDocument).toHaveBeenCalled();
      expect(mockPipeline.runTreeAnalysis).toHaveBeenCalled();

      // Step 3: Pipeline completes — update analysisResult signal
      mockPipeline.analysisResult.set(mockResult);
      fixture.detectChanges();

      // Step 4: Verify AccessibilityTree received the updated tree
      const treeDebugEl = fixture.debugElement.query(
        By.directive(MockAccessibilityTree),
      );
      const treeComponent =
        treeDebugEl.componentInstance as MockAccessibilityTree;
      expect(treeComponent.tree()).toEqual(
        mockResult.accessibilityAnalysis.treeNodes,
      );

      // Step 5: Set feedbackVisible to true to see results (simulating checkSolution)
      (
        component as unknown as {
          feedbackVisible: { set: (v: boolean) => void };
        }
      ).feedbackVisible.set(true);
      mockPipeline.isAnalyzing.set(false);
      fixture.detectChanges();

      // Step 6: Verify ChallengeFeedback received the updated result
      const feedbackDebugEl = fixture.debugElement.query(
        By.directive(MockChallengeFeedback),
      );
      const feedbackComponent =
        feedbackDebugEl.componentInstance as MockChallengeFeedback;
      expect(feedbackComponent.result()).toEqual(mockResult);
    });
  });

  describe('Explicit Feedback Reveal', () => {
    describe('feedbackState computed', () => {
      it('should return "button" when feedbackVisible is false', () => {
        // feedbackVisible starts as false by default
        const state = (
          component as unknown as { feedbackState: () => string }
        ).feedbackState();
        expect(state).toBe('button');
      });

      it('should return "loading" when feedbackVisible is true and isAnalyzing is true', () => {
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);
        mockPipeline.isAnalyzing.set(true);
        const state = (
          component as unknown as { feedbackState: () => string }
        ).feedbackState();
        expect(state).toBe('loading');
      });

      it('should return "results" when feedbackVisible is true and isAnalyzing is false', () => {
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);
        mockPipeline.isAnalyzing.set(false);
        const state = (
          component as unknown as { feedbackState: () => string }
        ).feedbackState();
        expect(state).toBe('results');
      });
    });

    describe('Check Solution button', () => {
      it('should render Check Solution button when feedbackState is "button"', () => {
        // feedbackVisible is false by default → feedbackState is 'button'
        fixture.detectChanges();
        const btn = fixture.debugElement.query(By.css('.check-solution-btn'));
        expect(btn).toBeTruthy();
      });

      it('should have accessible name "Check Solution"', () => {
        fixture.detectChanges();
        const btn = fixture.debugElement.query(By.css('.check-solution-btn'));
        expect(btn.nativeElement.textContent.trim()).toBe('Check Solution');
      });

      it('should be a native <button> element', () => {
        fixture.detectChanges();
        const btn = fixture.debugElement.query(By.css('.check-solution-btn'));
        expect(btn.nativeElement.tagName.toLowerCase()).toBe('button');
      });
    });

    describe('Auto-hide on code edit', () => {
      it('should reset feedbackVisible to false on onHtmlContentChange', () => {
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);
        (
          component as unknown as { onHtmlContentChange: (c: string) => void }
        ).onHtmlContentChange('<p>new</p>');
        const visible = (
          component as unknown as { feedbackVisible: () => boolean }
        ).feedbackVisible();
        expect(visible).toBe(false);
      });

      it('should reset feedbackVisible to false on onCssContentChange', () => {
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);
        (
          component as unknown as { onCssContentChange: (c: string) => void }
        ).onCssContentChange('body { color: blue; }');
        const visible = (
          component as unknown as { feedbackVisible: () => boolean }
        ).feedbackVisible();
        expect(visible).toBe(false);
      });
    });
  });

  describe('Reveal / Reset solution', () => {
    const mockChallengeWithSolution: Challenge = {
      ...mockChallenge,
      solution: {
        html: '<button>Accessible button</button>',
        js: 'console.log("solution")',
        css: 'button { color: green; }',
        vtt: '',
      },
    };

    describe('revealSolution()', () => {
      it('should set editor content to solution code and mark solutionRevealed', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        const shell = component as unknown as {
          revealSolution: () => void;
          solutionRevealed: () => boolean;
          htmlContent: () => string;
          jsContent: () => string;
          cssContent: () => string;
          vttContent: () => string;
        };

        shell.revealSolution();

        expect(shell.solutionRevealed()).toBe(true);
        expect(shell.htmlContent()).toBe('<button>Accessible button</button>');
        expect(shell.jsContent()).toBe('console.log("solution")');
        expect(shell.cssContent()).toBe('button { color: green; }');
        expect(shell.vttContent()).toBe('');
      });

      it('should call pipeline.updateCode with solution content', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();
        mockPipeline.updateCode.mockClear();

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();

        expect(mockPipeline.updateCode).toHaveBeenCalledWith(
          '<button>Accessible button</button>',
          'console.log("solution")',
          'button { color: green; }',
        );
      });

      it('should hide feedback panel on reveal', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        // First set feedbackVisible to true
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();

        const visible = (
          component as unknown as { feedbackVisible: () => boolean }
        ).feedbackVisible();
        expect(visible).toBe(false);
      });
    });

    describe('resetToStarter()', () => {
      it('should restore editor to starter code and clear solutionRevealed', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        const shell = component as unknown as {
          revealSolution: () => void;
          resetToStarter: () => void;
          solutionRevealed: () => boolean;
          htmlContent: () => string;
          jsContent: () => string;
          cssContent: () => string;
          vttContent: () => string;
        };

        // Reveal first, then reset
        shell.revealSolution();
        expect(shell.solutionRevealed()).toBe(true);

        shell.resetToStarter();

        expect(shell.solutionRevealed()).toBe(false);
        expect(shell.htmlContent()).toBe(
          mockChallengeWithSolution.starter.html,
        );
        expect(shell.jsContent()).toBe(mockChallengeWithSolution.starter.js);
        expect(shell.cssContent()).toBe(mockChallengeWithSolution.starter.css);
        expect(shell.vttContent()).toBe(mockChallengeWithSolution.starter.vtt);
      });

      it('should call pipeline.updateCode with starter content', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();
        mockPipeline.updateCode.mockClear();

        (
          component as unknown as { resetToStarter: () => void }
        ).resetToStarter();

        expect(mockPipeline.updateCode).toHaveBeenCalledWith(
          mockChallengeWithSolution.starter.html,
          mockChallengeWithSolution.starter.js,
          mockChallengeWithSolution.starter.css,
        );
      });

      it('should hide feedback panel on reset', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();
        (
          component as unknown as {
            feedbackVisible: { set: (v: boolean) => void };
          }
        ).feedbackVisible.set(true);

        (
          component as unknown as { resetToStarter: () => void }
        ).resetToStarter();

        const visible = (
          component as unknown as { feedbackVisible: () => boolean }
        ).feedbackVisible();
        expect(visible).toBe(false);
      });
    });

    describe('hasSolution computed', () => {
      it('should be true when challenge has solution', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        const hasSolution = (
          component as unknown as { hasSolution: () => boolean }
        ).hasSolution();
        expect(hasSolution).toBe(true);
      });

      it('should be false when challenge has no solution', () => {
        // mockChallenge has no solution field
        const hasSolution = (
          component as unknown as { hasSolution: () => boolean }
        ).hasSolution();
        expect(hasSolution).toBe(false);
      });
    });

    describe('isPeeked signal', () => {
      it('should reflect progress store peeked state', async () => {
        // The ProgressStore uses in-memory fallback in test environment.
        // We use the real store and pre-populate it with peeked data.
        const progressStore = TestBed.inject(ProgressStore);
        await progressStore.markChallengePeeked('test-challenge');

        // Re-set challenge input to trigger the effect that loads peeked state
        fixture.componentRef.setInput('challenge', { ...mockChallenge });
        fixture.detectChanges();
        await fixture.whenStable();

        const isPeeked = (
          component as unknown as { isPeeked: () => boolean }
        ).isPeeked();
        expect(isPeeked).toBe(true);
      });

      it('should be false for challenges not in peekedChallenges', () => {
        const isPeeked = (
          component as unknown as { isPeeked: () => boolean }
        ).isPeeked();
        expect(isPeeked).toBe(false);
      });
    });

    describe('Error handling', () => {
      it('should set revealError when challenge has no solution and revealSolution is called', () => {
        // mockChallenge has no solution
        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();
        const error = (
          component as unknown as { revealError: () => string }
        ).revealError();
        expect(error).toContain('Solution could not be loaded');
      });

      it('should preserve editor content when revealSolution fails due to missing solution', () => {
        // mockChallenge has no solution - editor should keep starter content
        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();
        const html = (
          component as unknown as { htmlContent: () => string }
        ).htmlContent();
        expect(html).toBe(mockChallenge.starter.html);
      });

      it('should set revealError signal when revealSolution is called without solution', () => {
        // Trigger error by calling revealSolution without solution
        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();

        const error = (
          component as unknown as { revealError: () => string }
        ).revealError();
        expect(error).toContain('Solution could not be loaded');
      });

      it('should clear error and re-attempt on retryReveal()', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        // First, manually set an error to simulate a previous failure
        (
          component as unknown as { revealError: { set: (v: string) => void } }
        ).revealError.set('Previous error');
        fixture.detectChanges();

        // Now retry - should succeed since challenge has solution
        (component as unknown as { retryReveal: () => void }).retryReveal();

        const error = (
          component as unknown as { revealError: () => string }
        ).revealError();
        expect(error).toBe('');

        const html = (
          component as unknown as { htmlContent: () => string }
        ).htmlContent();
        expect(html).toBe(mockChallengeWithSolution.solution!.html);
      });
    });

    describe('live region announcement', () => {
      it('should announce "Solution revealed" on revealSolution()', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();

        const announcement = (
          component as unknown as { solutionAnnouncement: () => string }
        ).solutionAnnouncement();
        expect(announcement).toBe('Solution revealed');
      });

      it('should clear announcement on resetToStarter()', async () => {
        fixture.componentRef.setInput('challenge', mockChallengeWithSolution);
        fixture.detectChanges();
        await fixture.whenStable();

        (
          component as unknown as { revealSolution: () => void }
        ).revealSolution();
        (
          component as unknown as { resetToStarter: () => void }
        ).resetToStarter();

        const announcement = (
          component as unknown as { solutionAnnouncement: () => string }
        ).solutionAnnouncement();
        expect(announcement).toBe('');
      });
    });
  });

  describe('discussion link', () => {
    const challengeWithDiscussion: Challenge = {
      ...mockChallenge,
      discussionUrl:
        'https://github.com/d-koppenhagen/practica11y/discussions/42',
    };

    it('should render discussion button in feedback header when discussionUrl is present', async () => {
      fixture.componentRef.setInput('challenge', challengeWithDiscussion);
      fixture.detectChanges();
      await fixture.whenStable();

      const link = fixture.debugElement.query(
        By.css('.feedback-discussion-btn'),
      );
      expect(link).toBeTruthy();
    });

    it('should NOT render discussion button when discussionUrl is undefined', () => {
      // mockChallenge has no discussionUrl
      const link = fixture.debugElement.query(
        By.css('.feedback-discussion-btn'),
      );
      expect(link).toBeFalsy();
    });

    it('should have target="_blank" and rel="noopener noreferrer" attributes', async () => {
      fixture.componentRef.setInput('challenge', challengeWithDiscussion);
      fixture.detectChanges();
      await fixture.whenStable();

      const link = fixture.debugElement.query(
        By.css('.feedback-discussion-btn'),
      );
      expect(link.nativeElement.getAttribute('target')).toBe('_blank');
      expect(link.nativeElement.getAttribute('rel')).toBe(
        'noopener noreferrer',
      );
    });

    it('should have an accessible aria-label', async () => {
      fixture.componentRef.setInput('challenge', challengeWithDiscussion);
      fixture.detectChanges();
      await fixture.whenStable();

      const link = fixture.debugElement.query(
        By.css('.feedback-discussion-btn'),
      );
      expect(link.nativeElement.getAttribute('aria-label')).toBe(
        'Discuss this challenge',
      );
    });

    it('should be a semantic <a> element (keyboard-focusable by default)', async () => {
      fixture.componentRef.setInput('challenge', challengeWithDiscussion);
      fixture.detectChanges();
      await fixture.whenStable();

      const link = fixture.debugElement.query(
        By.css('.feedback-discussion-btn'),
      );
      expect(link.nativeElement.tagName.toLowerCase()).toBe('a');
    });
  });
});
