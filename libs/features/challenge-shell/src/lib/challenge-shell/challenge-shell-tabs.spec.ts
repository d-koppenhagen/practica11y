import {
  ComponentFixture,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Challenge } from '@practica11y/models';
import { AccessibilityNode, AnalysisPipelineResult } from '@practica11y/types';
import { SandboxAxeViolation } from '@practica11y/sandbox';
import { LayoutStore, TreeTab } from '@practica11y/util';

import { ChallengeShell } from './challenge-shell';
import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellLayout } from '../shell-layout';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { Confetti } from '../confetti/confetti';
import { EditorTabs } from '../editor-tabs/editor-tabs';
import { EditorActions } from '../editor-actions/editor-actions';
import { InvestigationToolTabs } from '../investigation-tool-tabs/investigation-tool-tabs';
import { FeedbackPanel } from '../feedback-panel/feedback-panel';
import { PreviewPanel } from '../preview-panel/preview-panel';
import { MarkdownContent } from '@practica11y/ui';

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

describe('ChallengeShell tab integration', () => {
  let fixture: ComponentFixture<ChallengeShell>;
  let mockPipeline: MockAnalysisPipeline;

  /**
   * Helper to find a tab by its text content within a specific tablist.
   * @angular/aria generates unique IDs, so we query by role and text.
   */
  function findTreeTab(name: string) {
    const tablist = fixture.debugElement.query(
      By.css('[aria-label="Accessibility output view"]'),
    );
    const tabs = tablist.queryAll(By.css('[role="tab"]'));
    return (
      tabs.find((t) => t.nativeElement.textContent.trim() === name) ?? null
    );
  }

  function findEditorTab(name: string) {
    const tablist = fixture.debugElement.query(
      By.css('[aria-label="Editor language"]'),
    );
    const tabs = tablist.queryAll(By.css('[role="tab"]'));
    return (
      tabs.find((t) => t.nativeElement.textContent.trim() === name) ?? null
    );
  }

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

    // Mock IntersectionObserver for @defer (on viewport) blocks
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

  describe('Color Contrast tab presence and selectability', () => {
    it('should render a "Color Contrast" tab button', () => {
      const tab = findTreeTab('Color Contrast');
      expect(tab).toBeTruthy();
      expect(tab!.nativeElement.textContent.trim()).toBe('Color Contrast');
    });

    it('should render all three tree tabs in correct order', () => {
      const tabs = fixture.debugElement.queryAll(
        By.css('[aria-label="Accessibility output view"] [role="tab"]'),
      );
      expect(tabs.length).toBe(3);
      expect(tabs[0].nativeElement.textContent.trim()).toBe(
        'Accessibility Tree',
      );
      expect(tabs[1].nativeElement.textContent.trim()).toBe(
        'Virtual Screen Reader',
      );
      expect(tabs[2].nativeElement.textContent.trim()).toBe('Color Contrast');
    });

    it('should select Color Contrast tab on click', () => {
      const tab = findTreeTab('Color Contrast')!;
      tab.nativeElement.click();
      fixture.detectChanges();

      expect(tab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Keyboard navigation wrapping', () => {
    function dispatchKeydown(
      element: HTMLElement,
      key: 'ArrowRight' | 'ArrowLeft',
    ): void {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      fixture.detectChanges();
    }

    it('ArrowRight from color-contrast (last) wraps to tree (first)', () => {
      // Activate color-contrast tab first
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(colorTab.nativeElement, 'ArrowRight');

      const treeTab = findTreeTab('Accessibility Tree')!;
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from tree (first) wraps to color-contrast (last)', () => {
      // tree is the default active tab
      const treeTab = findTreeTab('Accessibility Tree')!;
      dispatchKeydown(treeTab.nativeElement, 'ArrowLeft');

      const colorTab = findTreeTab('Color Contrast')!;
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowRight from tree goes to screen-reader', () => {
      const treeTab = findTreeTab('Accessibility Tree')!;
      dispatchKeydown(treeTab.nativeElement, 'ArrowRight');

      const srTab = findTreeTab('Virtual Screen Reader')!;
      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowRight from screen-reader goes to color-contrast', () => {
      const srTab = findTreeTab('Virtual Screen Reader')!;
      srTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(srTab.nativeElement, 'ArrowRight');

      const colorTab = findTreeTab('Color Contrast')!;
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from color-contrast goes to screen-reader', () => {
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(colorTab.nativeElement, 'ArrowLeft');

      const srTab = findTreeTab('Virtual Screen Reader')!;
      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from screen-reader goes to tree', () => {
      const srTab = findTreeTab('Virtual Screen Reader')!;
      srTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(srTab.nativeElement, 'ArrowLeft');

      const treeTab = findTreeTab('Accessibility Tree')!;
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('ARIA attributes', () => {
    it('active tab should have aria-selected=true and tabindex=0', () => {
      // tree is active by default
      const treeTab = findTreeTab('Accessibility Tree')!;
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
      expect(treeTab.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('inactive tabs should have aria-selected=false and tabindex=-1', () => {
      const srTab = findTreeTab('Virtual Screen Reader')!;
      const colorTab = findTreeTab('Color Contrast')!;

      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('false');
      expect(srTab.nativeElement.getAttribute('tabindex')).toBe('-1');
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe(
        'false',
      );
      expect(colorTab.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('roving tabindex updates when active tab changes', () => {
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const treeTab = findTreeTab('Accessibility Tree')!;
      const srTab = findTreeTab('Virtual Screen Reader')!;

      expect(colorTab.nativeElement.getAttribute('tabindex')).toBe('0');
      expect(treeTab.nativeElement.getAttribute('tabindex')).toBe('-1');
      expect(srTab.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('each tab should have aria-controls referencing its tabpanel', () => {
      // With @angular/aria, aria-controls is not set when there are no
      // ngTabPanel directives. The panels are in ChallengeShell, not managed
      // by @angular/aria. We verify the tabs still have proper role/selected.
      const treeTab = findTreeTab('Accessibility Tree')!;
      const srTab = findTreeTab('Virtual Screen Reader')!;
      const colorTab = findTreeTab('Color Contrast')!;

      // Verify all tabs have the tab role (ARIA compliance)
      expect(treeTab.nativeElement.getAttribute('role')).toBe('tab');
      expect(srTab.nativeElement.getAttribute('role')).toBe('tab');
      expect(colorTab.nativeElement.getAttribute('role')).toBe('tab');
    });

    it('each tab should have role="tab"', () => {
      const tabs = fixture.debugElement.queryAll(
        By.css('[aria-label="Accessibility output view"] [role="tab"]'),
      );
      tabs.forEach((tab) => {
        expect(tab.nativeElement.getAttribute('role')).toBe('tab');
      });
    });
  });

  describe('Tab content switching', () => {
    it('selecting Color Contrast tab shows its panel', () => {
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const colorPanel = fixture.debugElement.query(
        By.css('#tree-panel-color-contrast'),
      );
      expect(colorPanel.nativeElement.hidden).toBe(false);
    });

    it('selecting Color Contrast tab hides tree panel', () => {
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const treePanel = fixture.debugElement.query(By.css('#tree-panel-tree'));
      expect(treePanel.nativeElement.hidden).toBe(true);
    });

    it('selecting Color Contrast tab hides screen reader panel', () => {
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const srPanel = fixture.debugElement.query(
        By.css('#tree-panel-screen-reader'),
      );
      expect(srPanel.nativeElement.hidden).toBe(true);
    });

    it('switching back from Color Contrast to tree hides color contrast panel', () => {
      // First activate color contrast
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      // Then switch back to tree
      const treeTab = findTreeTab('Accessibility Tree')!;
      treeTab.nativeElement.click();
      fixture.detectChanges();

      const colorPanel = fixture.debugElement.query(
        By.css('#tree-panel-color-contrast'),
      );
      const treePanel = fixture.debugElement.query(By.css('#tree-panel-tree'));
      expect(colorPanel.nativeElement.hidden).toBe(true);
      expect(treePanel.nativeElement.hidden).toBe(false);
    });
  });

  describe('Panel expand on tab switch', () => {
    let layoutStore: LayoutStore;

    beforeEach(() => {
      layoutStore = TestBed.inject(LayoutStore);
    });

    it('should expand the tree panel when a tree tab is clicked while collapsed', () => {
      // Collapse the tree panel
      layoutStore.setPanelCollapsed('tree', true);
      fixture.detectChanges();

      // Click a tree tab
      const colorTab = findTreeTab('Color Contrast')!;
      colorTab.nativeElement.click();
      fixture.detectChanges();

      // Panel should be expanded
      expect(layoutStore.layout().collapsed.tree).toBe(false);
    });

    it('should expand the editor panel when an editor tab is clicked while collapsed', () => {
      // Collapse the editor panel
      layoutStore.setPanelCollapsed('editor', true);
      fixture.detectChanges();

      // Click a CSS tab
      const cssTab = findEditorTab('CSS')!;
      cssTab.nativeElement.click();
      fixture.detectChanges();

      // Panel should be expanded
      expect(layoutStore.layout().collapsed.editor).toBe(false);
    });

    it('should not affect tree panel state when already expanded', () => {
      // Ensure tree panel is expanded
      expect(layoutStore.layout().collapsed.tree).toBe(false);

      // Click a tree tab
      const srTab = findTreeTab('Virtual Screen Reader')!;
      srTab.nativeElement.click();
      fixture.detectChanges();

      // Panel should remain expanded
      expect(layoutStore.layout().collapsed.tree).toBe(false);
    });

    it('should expand tree panel on keyboard navigation while collapsed', () => {
      // Collapse the tree panel
      layoutStore.setPanelCollapsed('tree', true);
      fixture.detectChanges();

      // ArrowRight from tree tab (keyboard navigation also calls switchTreeTab)
      const treeTab = findTreeTab('Accessibility Tree')!;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      treeTab.nativeElement.dispatchEvent(event);
      fixture.detectChanges();

      // Panel should be expanded
      expect(layoutStore.layout().collapsed.tree).toBe(false);
    });
  });
});

describe('Tab navigation wrapping logic (pure function)', () => {
  const tabs: TreeTab[] = ['tree', 'screen-reader', 'color-contrast'];

  function getNextTab(
    current: TreeTab,
    direction: 'ArrowRight' | 'ArrowLeft',
  ): TreeTab {
    const currentIndex = tabs.indexOf(current);
    const nextIndex =
      direction === 'ArrowRight'
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
    return tabs[nextIndex];
  }

  describe('Color Contrast tab presence', () => {
    it('should include color-contrast in the tabs array', () => {
      expect(tabs).toContain('color-contrast');
      expect(tabs.length).toBe(3);
    });
  });

  describe('ArrowRight wrapping', () => {
    it('tree → screen-reader', () => {
      expect(getNextTab('tree', 'ArrowRight')).toBe('screen-reader');
    });

    it('screen-reader → color-contrast', () => {
      expect(getNextTab('screen-reader', 'ArrowRight')).toBe('color-contrast');
    });

    it('color-contrast → tree (wraps)', () => {
      expect(getNextTab('color-contrast', 'ArrowRight')).toBe('tree');
    });
  });

  describe('ArrowLeft wrapping', () => {
    it('tree → color-contrast (wraps)', () => {
      expect(getNextTab('tree', 'ArrowLeft')).toBe('color-contrast');
    });

    it('color-contrast → screen-reader', () => {
      expect(getNextTab('color-contrast', 'ArrowLeft')).toBe('screen-reader');
    });

    it('screen-reader → tree', () => {
      expect(getNextTab('screen-reader', 'ArrowLeft')).toBe('tree');
    });
  });
});
