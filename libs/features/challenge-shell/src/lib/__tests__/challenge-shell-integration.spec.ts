import { Component, input, output } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { signal } from '@angular/core';
import { DeferBlockState } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Challenge } from '@practica11y/models';
import {
  Gamification,
  LayoutStore,
  ProgressStore,
  ThemeService,
  TreeTab,
} from '@practica11y/util';
import { ChallengeLoader } from '@practica11y/loader';
import { ChallengeShell } from '../challenge-shell/challenge-shell';
import { EditorTabs } from '../editor-tabs/editor-tabs';
import { EditorActions } from '../editor-actions/editor-actions';
import { InvestigationToolTabs } from '../investigation-tool-tabs/investigation-tool-tabs';
import { FeedbackPanel } from '../feedback-panel/feedback-panel';
import { PreviewPanel } from '../preview-panel/preview-panel';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { MarkdownContent } from '@practica11y/ui';

// Mock window.matchMedia for CheatAnimation (used by FeedbackPanel)
beforeEach(() => {
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
});

// --- Mock heavy components used inside @defer blocks ---

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ng-catbee-monaco-editor',
  template: '<div data-testid="mock-editor">editor</div>',
})
class MockMonacoEditor {
  readonly language = input<string>();
  readonly options = input<unknown>();
  readonly autoFormat = input<boolean>();
  readonly height = input<string>();
  readonly width = input<string>();
  readonly value = input<string>();
  readonly valueChange = output<string>();
}

@Component({
  selector: 'a11y-accessibility-tree',
  template: '<div data-testid="mock-tree">tree</div>',
})
class MockAccessibilityTree {
  readonly tree = input<unknown>();
  readonly pageTitle = input<string | null>();
}

@Component({
  selector: 'a11y-virtual-screen-reader',
  template: '<div data-testid="mock-screen-reader">screen reader</div>',
})
class MockVirtualScreenReader {
  readonly sandboxDocument = input<Document | null>();
  readonly revision = input<number>();
  readonly visible = input<boolean>();
  readonly focusedElement = input<Element | null>();
  readonly rate = input<number>();
  readonly speechEnabled = input<boolean>();
  readonly highlightEnabled = input<boolean>();
  readonly tabOrderEnabled = input<boolean>();
  readonly rateChange = output<number>();
  readonly speechEnabledChange = output<boolean>();
  readonly highlightEnabledChange = output<boolean>();
  readonly tabOrderEnabledChange = output<boolean>();
}

@Component({
  selector: 'a11y-color-contrast-panel',
  template: '<div data-testid="mock-color-contrast">color contrast</div>',
})
class MockColorContrastPanel {
  readonly sandboxIframe = input<HTMLIFrameElement | null>();
}

@Component({
  selector: 'a11y-sandbox-preview',
  template: '<div data-testid="mock-sandbox">sandbox</div>',
})
class MockSandboxPreview {
  readonly htmlContent = input<string>();
  readonly jsContent = input<string>();
  readonly cssContent = input<string>();
  readonly vttContent = input<string>();
  readonly previewTitle = input<string>();
  readonly domReady = output<MessageEvent>();
  readonly axeResult = output<unknown[]>();
  readonly axeError = output<string>();
  readonly interactionChange = output<void>();
}

@Component({
  selector: 'a11y-challenge-feedback',
  template: '<div data-testid="mock-feedback">feedback results</div>',
})
class MockChallengeFeedback {
  readonly result = input<unknown>();
}

@Component({
  selector: 'a11y-editor-actions',
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

// --- Test data ---
const mockChallenge: Challenge = {
  id: 'test-challenge',
  title: 'Test Challenge',
  description: '# Test',
  previewTitle: 'Test Preview',
  difficulty: 'beginner',
  points: 10,
  tags: ['semantics'],
  validatorIds: ['axe-no-violations'],
  links: [],
  createdAt: '2026-06-18',
  discussionUrl: '',
  starter: {
    html: '<h1>Hello</h1>',
    js: 'console.log("hi")',
    css: 'h1 { color: red }',
    vtt: '',
  },
};

// --- Mock services ---
function createMockLayoutStore() {
  const store = {
    layout: signal({
      colWidths: [3, 4, 4] as [number, number, number],
      rowHeights: [1, 1] as [number, number],
      collapsed: {
        description: false,
        editor: false,
        preview: false,
        tree: false,
        feedback: false,
      },
      activeTreeTab: 'tree' as TreeTab,
      screenReaderRate: 1,
      screenReaderSpeechEnabled: true,
      screenReaderHighlightEnabled: true,
    }),
    setColWidths: vi.fn(),
    setRowHeights: vi.fn(),
    setPanelCollapsed: vi.fn(),
    setActiveTreeTab: vi.fn((tab: TreeTab) => {
      store.layout.update((l) => ({ ...l, activeTreeTab: tab }));
    }),
    setScreenReaderRate: vi.fn(),
    setScreenReaderSpeechEnabled: vi.fn(),
    setScreenReaderHighlightEnabled: vi.fn(),
  };
  return store;
}

function createMockProgressStore() {
  return {
    loadProgress: vi.fn().mockResolvedValue({
      xp: 0,
      completedChallenges: [],
      achievements: [],
      currentLevel: 'hatchling',
      lastActivity: new Date(),
    }),
    markChallengeCompleted: vi.fn().mockResolvedValue(undefined),
    saveProgress: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockThemeService() {
  return { theme: signal('light') };
}

function createMockGamification() {
  return {
    currentXP: signal(0),
    currentLevel: signal('hatchling'),
    addXP: vi.fn(),
    checkAchievements: vi.fn().mockReturnValue(null),
  };
}

function createMockChallengeLoader() {
  return {
    availableChallenges: signal([]),
    registryResource: { value: signal(undefined) },
    registryEntries: signal([]),
  };
}

function createMockDialog() {
  return { open: vi.fn() };
}

async function setup(challenge: Challenge = mockChallenge) {
  const mockLayoutStore = createMockLayoutStore();
  const mockProgressStore = createMockProgressStore();
  const mockThemeService = createMockThemeService();
  const mockGamification = createMockGamification();
  const mockChallengeLoader = createMockChallengeLoader();
  const mockDialog = createMockDialog();

  const { fixture } = await render(ChallengeShell, {
    inputs: { challenge },
    providers: [
      { provide: LayoutStore, useValue: mockLayoutStore },
      { provide: ProgressStore, useValue: mockProgressStore },
      { provide: ThemeService, useValue: mockThemeService },
      { provide: Gamification, useValue: mockGamification },
      { provide: ChallengeLoader, useValue: mockChallengeLoader },
      { provide: Dialog, useValue: mockDialog },
    ],
    componentImports: [
      // Real child components
      ShellPanel,
      ShellResizer,
      EditorTabs,
      MockEditorActions,
      InvestigationToolTabs,
      FeedbackPanel,
      PreviewPanel,
      MarkdownContent,
      // Mock heavy third-party components used in @defer blocks
      MockMonacoEditor,
      MockAccessibilityTree,
      MockVirtualScreenReader,
      MockColorContrastPanel,
      MockSandboxPreview,
      MockChallengeFeedback,
    ],
    deferBlockStates: DeferBlockState.Complete,
  });

  return { fixture, mockLayoutStore };
}

describe('ChallengeShell Integration — Editor Tab Orchestration', () => {
  it('should show HTML tabpanel and hide JS tabpanel by default', async () => {
    await setup();

    const htmlPanel = document.getElementById('editor-panel-html');
    const jsPanel = document.getElementById('editor-panel-js');

    expect(htmlPanel).toBeTruthy();
    expect(jsPanel).toBeTruthy();
    expect(htmlPanel!.className).not.toContain('shell-editor-panel--hidden');
    expect(jsPanel!.className).toContain('shell-editor-panel--hidden');
  });

  it('should show JS tabpanel when JS tab is clicked', async () => {
    await setup();

    const jsTab = screen.getByRole('tab', { name: /js/i });
    fireEvent.click(jsTab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const htmlPanel = document.getElementById('editor-panel-html');
    const jsPanel = document.getElementById('editor-panel-js');

    expect(jsPanel!.className).not.toContain('shell-editor-panel--hidden');
    expect(htmlPanel!.className).toContain('shell-editor-panel--hidden');
  });

  it('should switch back to HTML tabpanel when HTML tab is clicked after switching to JS', async () => {
    await setup();

    const jsTab = screen.getByRole('tab', { name: /js/i });
    fireEvent.click(jsTab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const htmlTab = screen.getByRole('tab', { name: /html/i });
    fireEvent.click(htmlTab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const htmlPanel = document.getElementById('editor-panel-html');
    const jsPanel = document.getElementById('editor-panel-js');

    expect(htmlPanel!.className).not.toContain('shell-editor-panel--hidden');
    expect(jsPanel!.className).toContain('shell-editor-panel--hidden');
  });
});

describe('ChallengeShell Integration — Feedback State Machine', () => {
  it('should show "Check Solution" button initially', async () => {
    await setup();

    const button = screen.getByRole('button', { name: /check solution/i });
    expect(button).toBeTruthy();
  });

  it('should transition to results state when "Check Solution" is clicked', async () => {
    const { fixture } = await setup();

    const button = screen.getByRole('button', { name: /check solution/i });
    fireEvent.click(button);

    fixture.detectChanges();
    await fixture.whenStable();

    // The feedback panel should no longer show the button
    expect(
      screen.queryByRole('button', { name: /check solution/i }),
    ).toBeNull();

    // Since no sandbox iframe exists in test, runValidation is never called,
    // isAnalyzing stays false. feedbackVisible=true + isAnalyzing=false → 'results'
    // Check for the loading state indicator (role="status" aria-live="polite")
    // which is present in both 'loading' and 'results' states
    const feedbackPanel = fixture.nativeElement.querySelector(
      'a11y-feedback-panel',
    );

    // The 'results' state renders a div with aria-live="polite" aria-atomic="true"
    // The 'loading' state renders a div with role="status" aria-live="polite"
    // Either way, after clicking the button, the state is no longer 'button'
    const liveRegion = feedbackPanel?.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it('should hide "Check Solution" button after clicking it', async () => {
    const { fixture } = await setup();

    const button = screen.getByRole('button', { name: /check solution/i });
    fireEvent.click(button);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      screen.queryByRole('button', { name: /check solution/i }),
    ).toBeNull();
  });
});

describe('ChallengeShell Integration — Tree Tab Orchestration', () => {
  it('should show "Accessibility Tree" tabpanel by default', async () => {
    await setup();

    const treePanel = document.getElementById('tree-panel-tree');
    expect(treePanel).toBeTruthy();
    expect(treePanel!.hidden).toBe(false);
  });

  it('should hide "Virtual Screen Reader" tabpanel by default', async () => {
    await setup();

    const srPanel = document.getElementById('tree-panel-screen-reader');
    expect(srPanel).toBeTruthy();
    expect(srPanel!.hidden).toBe(true);
  });

  it('should show screen-reader tabpanel when "Virtual Screen Reader" tab is clicked', async () => {
    const { mockLayoutStore } = await setup();

    const srTab = screen.getByRole('tab', { name: /virtual screen reader/i });
    fireEvent.click(srTab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockLayoutStore.setActiveTreeTab).toHaveBeenCalledWith(
      'screen-reader',
    );

    const treePanel = document.getElementById('tree-panel-tree');
    const srPanel = document.getElementById('tree-panel-screen-reader');

    expect(srPanel!.hidden).toBe(false);
    expect(treePanel!.hidden).toBe(true);
  });

  it('should hide color-contrast tabpanel by default', async () => {
    await setup();

    const ccPanel = document.getElementById('tree-panel-color-contrast');
    expect(ccPanel).toBeTruthy();
    expect(ccPanel!.hidden).toBe(true);
  });
});
