import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  signal,
  computed,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Challenge } from '@practica11y/models';
import {
  CatbeeMonacoEditor,
  MonacoEditorOptions,
} from '@ng-catbee/monaco-editor';
import { SandboxPreview, SandboxAxeViolation } from '@practica11y/sandbox';
import { AccessibilityTree } from '@practica11y/accessibility-tree';
import { VirtualScreenReader } from '@practica11y/virtual-screen-reader';
import { ChallengeFeedback } from '@practica11y/challenge-feedback';
import { ChallengeLoader } from '@practica11y/loader';
import {
  AccessibilityNode,
  AxeViolation,
  LEVEL_THRESHOLDS,
} from '@practica11y/types';
import {
  renderMarkdown,
  Gamification,
  LayoutStore,
  ProgressStore,
  ThemeService,
  TreeTab,
} from '@practica11y/util';

import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import {
  ChallengeSuccessDialog,
  ChallengeSuccessDialogData,
} from '../challenge-success-dialog/challenge-success-dialog';

const GITHUB_REPO_URL = 'https://github.com/d-koppenhagen/practica11y';

type EditorTab = 'html' | 'js' | 'css';

@Component({
  selector: 'a11y-challenge-shell',
  imports: [
    CatbeeMonacoEditor,
    SandboxPreview,
    AccessibilityTree,
    VirtualScreenReader,
    ChallengeFeedback,
    ShellPanel,
    ShellResizer,
  ],
  providers: [AnalysisPipeline],
  templateUrl: './challenge-shell.html',
  styleUrl: './challenge-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeShell {
  readonly challenge = input.required<Challenge>();

  protected readonly pipeline = inject(AnalysisPipeline);
  private readonly layoutStore = inject(LayoutStore);
  private readonly progressStore = inject(ProgressStore);
  private readonly themeService = inject(ThemeService);
  private readonly dialog = inject(Dialog);
  private readonly gamification = inject(Gamification);
  private readonly challengeLoader = inject(ChallengeLoader);

  /** Timestamp of the analysis result for which the success dialog was shown. */
  private lastSuccessDialogTimestamp = 0;

  /** Human-readable current level label, e.g. "🌱 Hatchling". */
  protected readonly levelDisplay = computed(() => {
    const level = this.gamification.currentLevel();
    const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
    return threshold ? `${threshold.emoji} ${threshold.label}` : '🌱 Hatchling';
  });

  protected readonly htmlContent = signal<string>('');
  protected readonly jsContent = signal<string>('');
  protected readonly cssContent = signal<string>('');
  protected readonly activeEditorTab = signal<EditorTab>('html');
  /** Active accessibility output tab — persisted via the layout store. */
  protected readonly activeTreeTab = computed(
    () => this.layoutStore.layout().activeTreeTab,
  );
  /** Virtual screen reader playback rate — persisted via the layout store. */
  protected readonly screenReaderRate = computed(
    () => this.layoutStore.layout().screenReaderRate,
  );
  /** Virtual screen reader speech enabled — persisted via the layout store. */
  protected readonly screenReaderSpeechEnabled = computed(
    () => this.layoutStore.layout().screenReaderSpeechEnabled,
  );
  /** Virtual screen reader highlight enabled — persisted via the layout store. */
  protected readonly screenReaderHighlightEnabled = computed(
    () => this.layoutStore.layout().screenReaderHighlightEnabled,
  );
  protected readonly challengeCompleted = signal(false);

  protected readonly editorOptions = computed<MonacoEditorOptions>(() => ({
    theme: this.themeService.theme() === 'dark' ? 'hc-black' : 'hc-light',
    ariaLabel: 'Code Editor',
  }));

  private readonly hostRef = inject(ElementRef);

  // Panel references for tracking collapsed state
  protected readonly descriptionPanel =
    viewChild<ShellPanel>('descriptionPanel');
  protected readonly editorPanel = viewChild<ShellPanel>('editorPanel');
  protected readonly previewPanel = viewChild<ShellPanel>('previewPanel');
  protected readonly treePanel = viewChild<ShellPanel>('treePanel');
  protected readonly feedbackPanel = viewChild<ShellPanel>('feedbackPanel');

  /** Column widths — reads from layout store */
  protected readonly colWidths = computed(
    () => this.layoutStore.layout().colWidths,
  );

  /** Row heights — reads from layout store */
  protected readonly rowHeights = computed(
    () => this.layoutStore.layout().rowHeights,
  );

  /** Separator position as percentage for col1 resizer (left / total) */
  protected readonly col1SeparatorPercent = computed(() => {
    const [l, m, r] = this.colWidths();
    return Math.round((l / (l + m + r)) * 100);
  });

  /** Separator position as percentage for col2 resizer (middle / (middle + right)) */
  protected readonly col2SeparatorPercent = computed(() => {
    const [, m, r] = this.colWidths();
    return Math.round((m / (m + r)) * 100);
  });

  /** Separator position as percentage for row resizer (top / total) */
  protected readonly rowSeparatorPercent = computed(() => {
    const [t, b] = this.rowHeights();
    return Math.round((t / (t + b)) * 100);
  });

  /** Compute effective description flex: collapse to auto when panel is collapsed */
  protected readonly descriptionFlex = computed(() => {
    const panel = this.descriptionPanel();
    if (panel?.collapsed()) {
      return '0 0 auto';
    }
    return String(this.colWidths()[0]);
  });

  /** Compute effective top row flex: if both editor+preview are collapsed, row shrinks */
  protected readonly topRowFlex = computed(() => {
    const editor = this.editorPanel();
    const preview = this.previewPanel();
    if (editor?.collapsed() && preview?.collapsed()) {
      return '0 0 auto';
    }
    return String(this.rowHeights()[0]);
  });

  /** Compute effective bottom row flex: if both tree+feedback are collapsed, row shrinks */
  protected readonly bottomRowFlex = computed(() => {
    const tree = this.treePanel();
    const feedback = this.feedbackPanel();
    if (tree?.collapsed() && feedback?.collapsed()) {
      return '0 0 auto';
    }
    return String(this.rowHeights()[1]);
  });

  protected readonly accessibilityTree = computed<AccessibilityNode | null>(
    () =>
      this.pipeline.analysisResult()?.accessibilityAnalysis?.treeNodes ?? null,
  );

  protected readonly sandboxPageTitle = signal<string | null>(null);

  /** Live preview document, exposed to the virtual screen reader. */
  protected readonly sandboxDocument = signal<Document | null>(null);

  /** Bumped whenever the preview DOM changes, to re-run the screen reader. */
  protected readonly srRevision = signal<number>(0);

  protected readonly feedbackVisible = signal<boolean>(false);

  protected readonly feedbackState = computed<'button' | 'loading' | 'results'>(
    () => {
      if (!this.feedbackVisible()) {
        return 'button';
      }
      if (this.pipeline.isAnalyzing()) {
        return 'loading';
      }
      return 'results';
    },
  );

  protected readonly renderedDescription = computed(() =>
    renderMarkdown(this.challenge().description),
  );

  constructor() {
    effect(() => {
      const challenge = this.challenge();
      this.htmlContent.set(challenge.starter.html);
      this.jsContent.set(challenge.starter.js);
      this.cssContent.set(challenge.starter.css);
      this.feedbackVisible.set(false);
      this.pipeline.setChallenge(challenge);
      this.pipeline.updateCode(
        challenge.starter.html,
        challenge.starter.js,
        challenge.starter.css,
      );

      // Load completed status for this challenge
      this.progressStore.loadProgress().then((progress) => {
        this.challengeCompleted.set(
          progress.completedChallenges.includes(challenge.id),
        );
      });
    });

    // Update completed status when analysis result indicates completion
    effect(() => {
      if (this.pipeline.analysisResult()?.challengeCompleted) {
        this.challengeCompleted.set(true);
      }
    });

    // Show the success dialog once per fresh, user-triggered completion.
    effect(() => {
      const result = this.pipeline.analysisResult();
      if (
        result?.challengeCompleted &&
        this.feedbackVisible() &&
        result.timestamp !== this.lastSuccessDialogTimestamp
      ) {
        this.lastSuccessDialogTimestamp = result.timestamp;
        this.openSuccessDialog();
      }
    });

    // Restore collapsed state from store once panels are available
    effect(() => {
      const collapsed = this.layoutStore.layout().collapsed;
      const description = this.descriptionPanel();
      const editor = this.editorPanel();
      const preview = this.previewPanel();
      const tree = this.treePanel();
      const feedback = this.feedbackPanel();

      if (description) description.collapsed.set(collapsed.description);
      if (editor) editor.collapsed.set(collapsed.editor);
      if (preview) preview.collapsed.set(collapsed.preview);
      if (tree) tree.collapsed.set(collapsed.tree);
      if (feedback) feedback.collapsed.set(collapsed.feedback);
    });

    // Sync panel collapsed state back to store
    effect(() => {
      const description = this.descriptionPanel()?.collapsed() ?? false;
      const editor = this.editorPanel()?.collapsed() ?? false;
      const preview = this.previewPanel()?.collapsed() ?? false;
      const tree = this.treePanel()?.collapsed() ?? false;
      const feedback = this.feedbackPanel()?.collapsed() ?? false;

      // Only update if different from current store to avoid loops
      const current = this.layoutStore.layout().collapsed;
      if (
        current.description !== description ||
        current.editor !== editor ||
        current.preview !== preview ||
        current.tree !== tree ||
        current.feedback !== feedback
      ) {
        this.layoutStore.layout.update((l) => ({
          ...l,
          collapsed: { description, editor, preview, tree, feedback },
        }));
      }
    });
  }

  protected onResizeCol1(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridWidth =
      el.querySelector('.shell-grid')?.clientWidth ?? el.clientWidth;
    const [l, m, r] = this.colWidths();
    const total = l + m + r;
    const frDelta = (delta / gridWidth) * total;
    const newL = Math.max(0.5, l + frDelta);
    const newM = Math.max(0.5, m - frDelta);
    this.layoutStore.setColWidths([newL, newM, r]);
  }

  protected onResizeCol2(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridWidth =
      el.querySelector('.shell-grid')?.clientWidth ?? el.clientWidth;
    const [l, m, r] = this.colWidths();
    const total = l + m + r;
    const frDelta = (delta / gridWidth) * total;
    const newM = Math.max(0.5, m + frDelta);
    const newR = Math.max(0.5, r - frDelta);
    this.layoutStore.setColWidths([l, newM, newR]);
  }

  protected onResizeRow(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridHeight =
      el.querySelector('.shell-grid')?.clientHeight ?? el.clientHeight;
    const [t, b] = this.rowHeights();
    const total = t + b;
    const frDelta = (delta / gridHeight) * total;
    const newT = Math.max(0.3, t + frDelta);
    const newB = Math.max(0.3, b - frDelta);
    this.layoutStore.setRowHeights([newT, newB]);
  }

  protected onHtmlContentChange(content: string): void {
    this.htmlContent.set(content);
    this.feedbackVisible.set(false);
    this.pipeline.updateCode(content, this.jsContent(), this.cssContent());
  }

  protected onJsContentChange(content: string): void {
    this.jsContent.set(content);
    this.feedbackVisible.set(false);
    this.pipeline.updateCode(this.htmlContent(), content, this.cssContent());
  }

  protected onCssContentChange(content: string): void {
    this.cssContent.set(content);
    this.feedbackVisible.set(false);
    this.pipeline.updateCode(this.htmlContent(), this.jsContent(), content);
  }

  protected onDomReady(): void {
    const doc = this.getSandboxDocument();
    if (doc) {
      this.pipeline.setSandboxDocument(doc);
      this.pipeline.runTreeAnalysis(doc);
      this.sandboxPageTitle.set(doc.title || null);
      this.sandboxDocument.set(doc);
      this.srRevision.update((value) => value + 1);
    }
  }

  protected checkSolution(): void {
    this.feedbackVisible.set(true);
    const doc = this.getSandboxDocument();
    if (doc) {
      this.pipeline.runValidation(doc);
      this.requestIframeAnalysis();
    }
  }

  protected onAxeResult(axeResults: SandboxAxeViolation[]): void {
    this.pipeline.setAxeResults(axeResults as unknown as AxeViolation[]);
  }

  protected onAxeError(message: string): void {
    console.warn('[ChallengeShell] axe-core error in iframe:', message);
    this.pipeline.setAxeResults([]);
  }

  protected onInteractionChange(): void {
    const doc = this.getSandboxDocument();
    if (doc) {
      this.pipeline.updateTreeOnly(doc);
      this.sandboxPageTitle.set(doc.title || null);
      this.sandboxDocument.set(doc);
      this.srRevision.update((value) => value + 1);
    }
  }

  protected openPreviewInNewTab(): void {
    const html = this.htmlContent();
    const js = this.jsContent();
    const css = this.cssContent();
    const srcdoc = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
    const blob = new Blob([srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  protected readonly editorTabs = computed<EditorTab[]>(() => {
    const tabs: EditorTab[] = ['html'];
    if (this.challenge().starter.js) {
      tabs.push('js');
    }
    tabs.push('css');
    return tabs;
  });

  protected switchEditorTab(tab: EditorTab): void {
    this.activeEditorTab.set(tab);
  }

  protected switchTreeTab(tab: TreeTab): void {
    this.layoutStore.setActiveTreeTab(tab);
  }

  protected updateScreenReaderRate(rate: number): void {
    this.layoutStore.setScreenReaderRate(rate);
  }

  protected updateScreenReaderSpeechEnabled(enabled: boolean): void {
    this.layoutStore.setScreenReaderSpeechEnabled(enabled);
  }

  protected updateScreenReaderHighlightEnabled(enabled: boolean): void {
    this.layoutStore.setScreenReaderHighlightEnabled(enabled);
  }

  protected onTreeTabKeydown(event: KeyboardEvent, tab: TreeTab): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const tabs: TreeTab[] = ['tree', 'screen-reader'];
    const currentIndex = tabs.indexOf(tab);
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    this.switchTreeTab(nextTab);
    const el = (event.target as HTMLElement)
      .closest('[role="tablist"]')
      ?.querySelector(`#tree-tab-${nextTab}`) as HTMLElement | null;
    el?.focus();
  }

  protected onEditorTabKeydown(event: KeyboardEvent, tab: EditorTab): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const tabs = this.editorTabs();
      const currentIndex = tabs.indexOf(tab);
      let nextIndex: number;
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }
      const nextTab = tabs[nextIndex];
      this.switchEditorTab(nextTab);
      const tabId = `editor-tab-${nextTab}`;
      const el = (event.target as HTMLElement)
        .closest('[role="tablist"]')
        ?.querySelector(`#${tabId}`) as HTMLElement | null;
      el?.focus();
    }
  }

  private requestIframeAnalysis(): void {
    const host = this.hostRef.nativeElement as HTMLElement;
    const iframe = host.querySelector(
      '.shell-preview iframe',
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'run-analysis' }, '*');
    }
  }

  private getSandboxDocument(): Document | null {
    const host = this.hostRef.nativeElement as HTMLElement;
    const iframe = host.querySelector(
      '.shell-preview iframe',
    ) as HTMLIFrameElement | null;
    if (!iframe) return null;
    try {
      return iframe.contentDocument;
    } catch {
      return null;
    }
  }

  /** Opens the accessible success dialog with score and navigation actions. */
  private openSuccessDialog(): void {
    const challenge = this.challenge();
    const challenges = this.challengeLoader.availableChallenges();
    const idx = challenges.findIndex((c) => c.id === challenge.id);

    const prev = idx > 0 ? challenges[idx - 1] : null;
    const next =
      idx >= 0 && idx < challenges.length - 1 ? challenges[idx + 1] : null;

    const data: ChallengeSuccessDialogData = {
      challengeTitle: challenge.title,
      challengeId: challenge.id,
      pointsAwarded: challenge.points,
      currentXP: this.gamification.currentXP(),
      levelLabel: this.levelDisplay(),
      previousChallenge: prev ? { id: prev.id, title: prev.title } : null,
      nextChallenge: next ? { id: next.id, title: next.title } : null,
      issueUrl: this.buildFeedbackIssueUrl(challenge),
      issueChooserUrl: `${GITHUB_REPO_URL}/issues/new/choose`,
    };

    this.dialog.open<void, ChallengeSuccessDialogData>(ChallengeSuccessDialog, {
      data,
      ariaModal: true,
      ariaLabelledBy: 'challenge-success-title',
      autoFocus: 'dialog',
      restoreFocus: true,
      panelClass: 'success-dialog-panel',
    });
  }

  /**
   * Builds a pre-filled GitHub "new issue" URL for challenge feedback.
   * Targets the bug report issue form and pre-selects the current challenge in
   * the "Related challenge" dropdown. The value must match the dropdown option
   * label defined in `.github/ISSUE_TEMPLATE/bug_report.yml` exactly.
   */
  private buildFeedbackIssueUrl(challenge: Challenge): string {
    const params = new URLSearchParams({
      template: 'bug_report.yml',
      challenge: `${challenge.title} (${challenge.id})`,
    });

    return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
  }
}
