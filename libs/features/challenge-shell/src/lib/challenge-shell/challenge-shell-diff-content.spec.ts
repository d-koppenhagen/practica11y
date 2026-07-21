import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { Challenge } from '@practica11y/models';
import { AccessibilityNode, AnalysisPipelineResult } from '@practica11y/types';
import { SandboxAxeViolation } from '@practica11y/sandbox';

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
import {
  ChallengeMetaBar,
  EmptyAction,
  MarkdownContent,
} from '@practica11y/ui';
import { DiffLanguageEntry } from '../editor-diff-view/editor-diff-view';

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
  readonly autoFormat = input<boolean>(true);
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
  readonly simulationCss = input<string>('');
  readonly domReady = output<MessageEvent>();
  readonly axeResult = output<SandboxAxeViolation[]>();
  readonly axeError = output<string>();
}

@Component({
  selector: 'a11y-simulation-popover',
  standalone: true,
  template: '',
})
class MockSimulationPopover {}

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
  updateTreeOnly = vi.fn();
}

// --- Test data ---

const mockChallengeHtmlCss: Challenge = {
  id: 'html-css-challenge',
  title: 'HTML CSS Challenge',
  difficulty: 'beginner',
  tags: ['semantics'],
  points: 100,
  description: '<p>A challenge with HTML and CSS only.</p>',
  starter: {
    html: '<div>Hello</div>',
    js: '',
    css: 'div { color: red; }',
    vtt: '',
  },
  validatorIds: ['axe-no-violations'],
  previewTitle: 'Challenge: HTML CSS | Preview',
  links: [],
  createdAt: '2026-06-18',
};

const mockChallengeHtmlCssJs: Challenge = {
  id: 'html-css-js-challenge',
  title: 'HTML CSS JS Challenge',
  difficulty: 'intermediate',
  tags: ['semantics'],
  points: 200,
  description: '<p>A challenge with HTML, CSS, and JS.</p>',
  starter: {
    html: '<button>Click</button>',
    js: 'document.querySelector("button").addEventListener("click", () => {});',
    css: 'button { padding: 8px; }',
    vtt: '',
  },
  validatorIds: ['axe-no-violations'],
  previewTitle: 'Challenge: HTML CSS JS | Preview',
  links: [],
  createdAt: '2026-06-18',
};

const mockChallengeWithSolution: Challenge = {
  ...mockChallengeHtmlCssJs,
  id: 'solution-challenge',
  solution: {
    html: '<button aria-label="Submit">Submit</button>',
    js: 'console.log("solution");',
    css: 'button { color: green; }',
    vtt: '',
  },
};

describe('ChallengeShell - Diff Content Integration', () => {
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
            MockCatbeeMonacoDiffEditor,
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
            MockSimulationPopover,
          ],
          providers: [
            { provide: AnalysisPipeline, useValue: mockPipeline },
            ShellLayout,
          ],
        },
      })
      .overrideComponent(FeedbackPanel, {
        set: {
          imports: [MockChallengeFeedback, EmptyAction],
        },
      })
      .overrideComponent(PreviewPanel, {
        set: {
          imports: [MockSandboxPreview],
        },
      })
      .compileComponents();
  });

  async function createComponent(challenge: Challenge) {
    fixture = TestBed.createComponent(ChallengeShell);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('challenge', challenge);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  }

  describe('Diff entries count matches available languages', () => {
    it('should have 2 diff entries when challenge has only HTML and CSS starter', async () => {
      await createComponent(mockChallengeHtmlCss);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].language).toBe('html');
      expect(entries[1].language).toBe('css');
    });

    it('should have 3 diff entries when challenge has HTML, CSS, and JS starter', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].language).toBe('html');
      expect(entries[1].language).toBe('css');
      expect(entries[2].language).toBe('js');
    });

    it('should include VTT entry when challenge has VTT starter', async () => {
      const challengeWithVtt: Challenge = {
        ...mockChallengeHtmlCssJs,
        starter: {
          ...mockChallengeHtmlCssJs.starter,
          vtt: 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello',
        },
      };
      await createComponent(challengeWithVtt);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      expect(entries).toHaveLength(4);
      expect(entries[3].language).toBe('vtt');
    });
  });

  describe('Original shows starter code, modified shows current code', () => {
    it('should set original to starter HTML and modified to current htmlContent', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      const htmlEntry = entries.find((e) => e.language === 'html')!;
      expect(htmlEntry.original).toBe(mockChallengeHtmlCssJs.starter.html);
      expect(htmlEntry.modified).toBe(mockChallengeHtmlCssJs.starter.html);
    });

    it('should set original to starter CSS and modified to current cssContent', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      const cssEntry = entries.find((e) => e.language === 'css')!;
      expect(cssEntry.original).toBe(mockChallengeHtmlCssJs.starter.css);
      expect(cssEntry.modified).toBe(mockChallengeHtmlCssJs.starter.css);
    });

    it('should set original to starter JS and modified to current jsContent', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
      };

      const entries = shell.diffEntries();
      const jsEntry = entries.find((e) => e.language === 'js')!;
      expect(jsEntry.original).toBe(mockChallengeHtmlCssJs.starter.js);
      expect(jsEntry.modified).toBe(mockChallengeHtmlCssJs.starter.js);
    });

    it('should reflect updated htmlContent in the modified field after editing', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
        onHtmlContentChange: (content: string) => void;
      };

      shell.onHtmlContentChange('<h1>Updated</h1>');

      const entries = shell.diffEntries();
      const htmlEntry = entries.find((e) => e.language === 'html')!;
      expect(htmlEntry.original).toBe(mockChallengeHtmlCssJs.starter.html);
      expect(htmlEntry.modified).toBe('<h1>Updated</h1>');
    });

    it('should keep original unchanged even when modified changes', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        diffEntries: () => DiffLanguageEntry[];
        onCssContentChange: (content: string) => void;
      };

      shell.onCssContentChange('body { margin: 0; }');

      const entries = shell.diffEntries();
      const cssEntry = entries.find((e) => e.language === 'css')!;
      expect(cssEntry.original).toBe(mockChallengeHtmlCssJs.starter.css);
      expect(cssEntry.modified).toBe('body { margin: 0; }');
    });
  });

  describe('Edit propagation via onDiffModifiedChange', () => {
    it('should update htmlContent when onDiffModifiedChange is called with html language', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        onDiffModifiedChange: (event: {
          language: string;
          content: string;
        }) => void;
        htmlContent: () => string;
      };

      shell.onDiffModifiedChange({
        language: 'html',
        content: '<main>New HTML</main>',
      });

      expect(shell.htmlContent()).toBe('<main>New HTML</main>');
    });

    it('should update cssContent when onDiffModifiedChange is called with css language', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        onDiffModifiedChange: (event: {
          language: string;
          content: string;
        }) => void;
        cssContent: () => string;
      };

      shell.onDiffModifiedChange({
        language: 'css',
        content: 'body { background: blue; }',
      });

      expect(shell.cssContent()).toBe('body { background: blue; }');
    });

    it('should update jsContent when onDiffModifiedChange is called with js language', async () => {
      await createComponent(mockChallengeHtmlCssJs);

      const shell = component as unknown as {
        onDiffModifiedChange: (event: {
          language: string;
          content: string;
        }) => void;
        jsContent: () => string;
      };

      shell.onDiffModifiedChange({
        language: 'js',
        content: 'alert("hello");',
      });

      expect(shell.jsContent()).toBe('alert("hello");');
    });

    it('should update vttContent when onDiffModifiedChange is called with vtt language', async () => {
      const challengeWithVtt: Challenge = {
        ...mockChallengeHtmlCssJs,
        starter: {
          ...mockChallengeHtmlCssJs.starter,
          vtt: 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello',
        },
      };
      await createComponent(challengeWithVtt);

      const shell = component as unknown as {
        onDiffModifiedChange: (event: {
          language: string;
          content: string;
        }) => void;
        vttContent: () => string;
      };

      shell.onDiffModifiedChange({
        language: 'vtt',
        content: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nUpdated',
      });

      expect(shell.vttContent()).toBe(
        'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nUpdated',
      );
    });

    it('should call pipeline.updateCode when html content changes via diff', async () => {
      await createComponent(mockChallengeHtmlCssJs);
      mockPipeline.updateCode.mockClear();

      const shell = component as unknown as {
        onDiffModifiedChange: (event: {
          language: string;
          content: string;
        }) => void;
      };

      shell.onDiffModifiedChange({
        language: 'html',
        content: '<p>Diff edit</p>',
      });

      expect(mockPipeline.updateCode).toHaveBeenCalledWith(
        '<p>Diff edit</p>',
        mockChallengeHtmlCssJs.starter.js,
        mockChallengeHtmlCssJs.starter.css,
      );
    });
  });

  describe('Auto-open on solution reveal', () => {
    it('should activate diffViewActive when solutionRevealed becomes true', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        diffViewActive: () => boolean;
        solutionRevealed: () => boolean;
      };

      expect(shell.diffViewActive()).toBe(false);

      shell.revealSolution();
      // Allow effects to run
      TestBed.tick();

      expect(shell.solutionRevealed()).toBe(true);
      expect(shell.diffViewActive()).toBe(true);
    });

    it('should set viewModeAnnouncement when auto-opening diff view', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        viewModeAnnouncement: () => string;
      };

      shell.revealSolution();
      TestBed.tick();

      expect(shell.viewModeAnnouncement()).toBe('Switched to diff view');
    });

    it('should show solution code in modified side after reveal', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        diffEntries: () => DiffLanguageEntry[];
      };

      shell.revealSolution();
      TestBed.tick();

      const entries = shell.diffEntries();
      const htmlEntry = entries.find((e) => e.language === 'html')!;
      expect(htmlEntry.original).toBe(mockChallengeWithSolution.starter.html);
      expect(htmlEntry.modified).toBe(mockChallengeWithSolution.solution!.html);
    });
  });

  describe('Reset/restore deactivates diff view', () => {
    it('should deactivate diffViewActive on resetToStarter after reveal', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        resetToStarter: () => void;
        diffViewActive: () => boolean;
      };

      shell.revealSolution();
      TestBed.tick();
      expect(shell.diffViewActive()).toBe(true);

      shell.resetToStarter();

      expect(shell.diffViewActive()).toBe(false);
    });

    it('should deactivate diffViewActive on restoreUserCode after reveal', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        restoreUserCode: () => void;
        diffViewActive: () => boolean;
      };

      shell.revealSolution();
      TestBed.tick();
      expect(shell.diffViewActive()).toBe(true);

      shell.restoreUserCode();

      expect(shell.diffViewActive()).toBe(false);
    });

    it('should preserve correct htmlContent after resetToStarter from diff view', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        resetToStarter: () => void;
        htmlContent: () => string;
        cssContent: () => string;
      };

      shell.revealSolution();
      TestBed.tick();

      shell.resetToStarter();

      expect(shell.htmlContent()).toBe(mockChallengeWithSolution.starter.html);
      expect(shell.cssContent()).toBe(mockChallengeWithSolution.starter.css);
    });

    it('should preserve correct htmlContent after restoreUserCode from diff view', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        restoreUserCode: () => void;
        htmlContent: () => string;
        cssContent: () => string;
      };

      shell.revealSolution();
      TestBed.tick();

      shell.restoreUserCode();

      // restoreUserCode should restore the user snapshot (starter content before reveal)
      expect(shell.htmlContent()).toBe(mockChallengeWithSolution.starter.html);
      expect(shell.cssContent()).toBe(mockChallengeWithSolution.starter.css);
    });

    it('should clear viewModeAnnouncement on resetToStarter', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        resetToStarter: () => void;
        viewModeAnnouncement: () => string;
      };

      shell.revealSolution();
      TestBed.tick();
      expect(shell.viewModeAnnouncement()).toBe('Switched to diff view');

      shell.resetToStarter();

      expect(shell.viewModeAnnouncement()).toBe('');
    });

    it('should call pipeline.updateCode with starter content on resetToStarter from diff view', async () => {
      await createComponent(mockChallengeWithSolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        resetToStarter: () => void;
      };

      shell.revealSolution();
      TestBed.tick();
      mockPipeline.updateCode.mockClear();

      shell.resetToStarter();

      expect(mockPipeline.updateCode).toHaveBeenCalledWith(
        mockChallengeWithSolution.starter.html,
        mockChallengeWithSolution.starter.js,
        mockChallengeWithSolution.starter.css,
      );
    });

    it('should not have CSS content in htmlContent after resetToStarter (regression)', async () => {
      // This is the specific regression test for the bug where CSS appeared
      // as visible text in the live preview after reveal → reset.
      const challengeHtmlOnlySolution: Challenge = {
        ...mockChallengeHtmlCss,
        solution: {
          html: '<button>Fixed</button>',
          js: '',
          css: '',
          vtt: '',
        },
      };
      await createComponent(challengeHtmlOnlySolution);

      const shell = component as unknown as {
        revealSolution: () => void;
        resetToStarter: () => void;
        htmlContent: () => string;
        cssContent: () => string;
      };

      shell.revealSolution();
      TestBed.tick();

      shell.resetToStarter();

      // htmlContent must be the starter HTML, NOT the CSS
      expect(shell.htmlContent()).toBe(challengeHtmlOnlySolution.starter.html);
      expect(shell.htmlContent()).not.toContain('color: red');
      // cssContent must be the starter CSS
      expect(shell.cssContent()).toBe(challengeHtmlOnlySolution.starter.css);
    });

    it('should not corrupt jsContent with cssContent when JS tab is active before reveal (regression)', async () => {
      // Regression: when JS tab was active and revealSolution was called,
      // syncEditorValues() would write CSS content into the JS editor due to
      // a positional mismatch between @defer-rendered editors and editorTabs().
      const challengeHtmlOnlySolution: Challenge = {
        ...mockChallengeHtmlCssJs,
        solution: {
          html: '<button>Fixed</button>',
          js: '',
          css: '',
          vtt: '',
        },
      };
      await createComponent(challengeHtmlOnlySolution);

      const shell = component as unknown as {
        activeEditorTab: { set: (v: string) => void };
        switchEditorTab: (tab: string) => void;
        revealSolution: () => void;
        jsContent: () => string;
        cssContent: () => string;
        htmlContent: () => string;
      };

      // Switch to JS tab before revealing
      shell.switchEditorTab('js' as never);
      fixture.detectChanges();

      shell.revealSolution();
      TestBed.tick();

      // jsContent must remain the JS starter, not CSS content
      expect(shell.jsContent()).toBe(challengeHtmlOnlySolution.starter.js);
      expect(shell.jsContent()).not.toContain('padding');
      // cssContent must remain the CSS starter
      expect(shell.cssContent()).toBe(challengeHtmlOnlySolution.starter.css);
      // htmlContent should be the solution HTML
      expect(shell.htmlContent()).toBe(
        challengeHtmlOnlySolution.solution!.html,
      );
    });
  });
});
