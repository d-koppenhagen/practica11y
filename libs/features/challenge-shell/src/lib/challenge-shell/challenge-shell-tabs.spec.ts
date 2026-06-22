import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Challenge } from '@practica11y/models';
import { AccessibilityNode, AnalysisPipelineResult } from '@practica11y/types';
import { SandboxAxeViolation } from '@practica11y/sandbox';
import { LayoutStore, TreeTab } from '@practica11y/util';

import { ChallengeShell } from './challenge-shell';
import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { Confetti } from '../confetti/confetti';

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

describe('ChallengeShell tab integration', () => {
  let fixture: ComponentFixture<ChallengeShell>;
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

    mockPipeline = new MockAnalysisPipeline();

    await TestBed.configureTestingModule({
      imports: [ChallengeShell],
    })
      .overrideComponent(ChallengeShell, {
        set: {
          imports: [
            MockCatbeeMonacoEditor,
            MockSandboxPreview,
            MockAccessibilityTree,
            MockChallengeFeedback,
            MockVirtualScreenReader,
            MockColorContrastPanel,
            ShellPanel,
            ShellResizer,
            Confetti,
          ],
          providers: [{ provide: AnalysisPipeline, useValue: mockPipeline }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChallengeShell);
    fixture.componentRef.setInput('challenge', mockChallenge);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Color Contrast tab presence and selectability', () => {
    it('should render a "Color Contrast" tab button', () => {
      const tab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      expect(tab).toBeTruthy();
      expect(tab.nativeElement.textContent.trim()).toBe('Color Contrast');
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
      const tab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
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
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(colorTab.nativeElement, 'ArrowRight');

      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from tree (first) wraps to color-contrast (last)', () => {
      // tree is the default active tab
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      dispatchKeydown(treeTab.nativeElement, 'ArrowLeft');

      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowRight from tree goes to screen-reader', () => {
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      dispatchKeydown(treeTab.nativeElement, 'ArrowRight');

      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowRight from screen-reader goes to color-contrast', () => {
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      srTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(srTab.nativeElement, 'ArrowRight');

      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from color-contrast goes to screen-reader', () => {
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(colorTab.nativeElement, 'ArrowLeft');

      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowLeft from screen-reader goes to tree', () => {
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      srTab.nativeElement.click();
      fixture.detectChanges();

      dispatchKeydown(srTab.nativeElement, 'ArrowLeft');

      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('ARIA attributes', () => {
    it('active tab should have aria-selected=true and tabindex=0', () => {
      // tree is active by default
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      expect(treeTab.nativeElement.getAttribute('aria-selected')).toBe('true');
      expect(treeTab.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('inactive tabs should have aria-selected=false and tabindex=-1', () => {
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );

      expect(srTab.nativeElement.getAttribute('aria-selected')).toBe('false');
      expect(srTab.nativeElement.getAttribute('tabindex')).toBe('-1');
      expect(colorTab.nativeElement.getAttribute('aria-selected')).toBe(
        'false',
      );
      expect(colorTab.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('roving tabindex updates when active tab changes', () => {
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );

      expect(colorTab.nativeElement.getAttribute('tabindex')).toBe('0');
      expect(treeTab.nativeElement.getAttribute('tabindex')).toBe('-1');
      expect(srTab.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('each tab should have aria-controls referencing its tabpanel', () => {
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );

      expect(treeTab.nativeElement.getAttribute('aria-controls')).toBe(
        'tree-panel-tree',
      );
      expect(srTab.nativeElement.getAttribute('aria-controls')).toBe(
        'tree-panel-screen-reader',
      );
      expect(colorTab.nativeElement.getAttribute('aria-controls')).toBe(
        'tree-panel-color-contrast',
      );
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
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const colorPanel = fixture.debugElement.query(
        By.css('#tree-panel-color-contrast'),
      );
      expect(colorPanel.nativeElement.hidden).toBe(false);
    });

    it('selecting Color Contrast tab hides tree panel', () => {
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const treePanel = fixture.debugElement.query(By.css('#tree-panel-tree'));
      expect(treePanel.nativeElement.hidden).toBe(true);
    });

    it('selecting Color Contrast tab hides screen reader panel', () => {
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      const srPanel = fixture.debugElement.query(
        By.css('#tree-panel-screen-reader'),
      );
      expect(srPanel.nativeElement.hidden).toBe(true);
    });

    it('switching back from Color Contrast to tree hides color contrast panel', () => {
      // First activate color contrast
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
      colorTab.nativeElement.click();
      fixture.detectChanges();

      // Then switch back to tree
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
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
      const colorTab = fixture.debugElement.query(
        By.css('#tree-tab-color-contrast'),
      );
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
      const cssTab = fixture.debugElement.query(By.css('#editor-tab-css'));
      cssTab.nativeElement.click();
      fixture.detectChanges();

      // Panel should be expanded
      expect(layoutStore.layout().collapsed.editor).toBe(false);
    });

    it('should not affect tree panel state when already expanded', () => {
      // Ensure tree panel is expanded
      expect(layoutStore.layout().collapsed.tree).toBe(false);

      // Click a tree tab
      const srTab = fixture.debugElement.query(
        By.css('#tree-tab-screen-reader'),
      );
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
      const treeTab = fixture.debugElement.query(By.css('#tree-tab-tree'));
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
