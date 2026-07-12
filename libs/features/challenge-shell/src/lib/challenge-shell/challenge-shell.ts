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
  CatbeeMonacoDiffEditor,
  MonacoEditorOptions,
} from '@ng-catbee/monaco-editor';
import { SandboxAxeViolation } from '@practica11y/sandbox';
import { AccessibilityTree } from '@practica11y/accessibility-tree';
import { VirtualScreenReader } from '@practica11y/virtual-screen-reader';
import { ColorContrastPanel } from '@practica11y/color-contrast-checker';
import { EDITOR_FILE_TYPES, EditorFileType } from '@practica11y/editor-types';
import { ChallengeLoader } from '@practica11y/loader';
import {
  AccessibilityNode,
  AxeViolation,
  LEVEL_THRESHOLDS,
} from '@practica11y/types';
import {
  Gamification,
  LayoutStore,
  ProgressStore,
  ThemeService,
  TreeTab,
} from '@practica11y/util';
import { MarkdownContent } from '@practica11y/ui';

import { AnalysisPipeline } from '../analysis-pipeline';
import { ShellLayout } from '../shell-layout';
import { ShellPanel } from '../shell-panel/shell-panel';
import { ShellResizer } from '../shell-resizer/shell-resizer';
import { EditorTabs } from '../editor-tabs/editor-tabs';
import { EditorActions } from '../editor-actions/editor-actions';
import { InvestigationToolTabs } from '../investigation-tool-tabs/investigation-tool-tabs';
import { FeedbackPanel } from '../feedback-panel/feedback-panel';
import { PreviewPanel } from '../preview-panel/preview-panel';
import {
  ChallengeSuccessDialog,
  ChallengeSuccessDialogData,
} from '../challenge-success-dialog/challenge-success-dialog';
import { DiffLanguageEntry } from '../editor-diff-view/editor-diff-view';

const GITHUB_REPO_URL = 'https://github.com/d-koppenhagen/practica11y';

@Component({
  selector: 'a11y-challenge-shell',
  imports: [
    CatbeeMonacoEditor,
    CatbeeMonacoDiffEditor,
    AccessibilityTree,
    VirtualScreenReader,
    ColorContrastPanel,
    ShellPanel,
    ShellResizer,
    EditorTabs,
    EditorActions,
    InvestigationToolTabs,
    FeedbackPanel,
    PreviewPanel,
    MarkdownContent,
  ],
  providers: [AnalysisPipeline, ShellLayout],
  templateUrl: './challenge-shell.html',
  styleUrl: './challenge-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeShell {
  readonly challenge = input.required<Challenge>();

  protected readonly pipeline = inject(AnalysisPipeline);
  protected readonly shellLayout = inject(ShellLayout);
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
  protected readonly vttContent = signal<string>('');

  /** Maps file type IDs to their corresponding content signals. */
  private readonly contentSignals: Readonly<
    Record<EditorFileType, ReturnType<typeof signal<string>>>
  > = {
    html: this.htmlContent,
    css: this.cssContent,
    js: this.jsContent,
    vtt: this.vttContent,
  };

  protected readonly activeEditorTab = signal<EditorFileType>('html');

  /** Whether the diff view is currently active */
  protected readonly diffViewActive = signal(false);

  /** Announcement text for screen readers when view mode changes */
  protected readonly viewModeAnnouncement = signal('');

  /** Computed diff entries based on available languages and current content */
  protected readonly diffEntries = computed<DiffLanguageEntry[]>(() => {
    const challenge = this.challenge();
    const entries: DiffLanguageEntry[] = [];

    for (const fileType of EDITOR_FILE_TYPES) {
      const starterValue = challenge.starter[fileType.id];
      if (fileType.alwaysVisible || starterValue) {
        entries.push({
          language: fileType.id,
          label: fileType.label,
          monacoLanguage: fileType.monacoLanguage,
          original: starterValue,
          modified: this.contentSignals[fileType.id](),
        });
      }
    }

    return entries;
  });
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
  /** Virtual screen reader tab order overlay enabled — persisted via the layout store. */
  protected readonly screenReaderTabOrderEnabled = computed(
    () => this.layoutStore.layout().screenReaderTabOrderEnabled,
  );
  protected readonly challengeCompleted = signal(false);
  protected readonly solutionRevealed = signal(false);
  protected readonly isPeeked = signal(false);
  protected readonly hasSolution = computed(
    () => this.challenge().solution !== undefined,
  );
  protected readonly solutionAnnouncement = signal('');
  protected readonly revealError = signal('');

  /** Snapshot of the user's code before reveal, so they can switch back */
  private userSnapshot: Record<EditorFileType, string> | null = null;
  protected readonly hasUserSnapshot = signal(false);

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

  /** Column widths — delegated to ShellLayout */
  protected readonly colWidths = this.shellLayout.colWidths;

  /** Row heights — delegated to ShellLayout */
  protected readonly rowHeights = this.shellLayout.rowHeights;

  /** Separator position as percentage for col1 resizer (left / total) */
  protected readonly col1SeparatorPercent =
    this.shellLayout.col1SeparatorPercent;

  /** Separator position as percentage for col2 resizer (middle / (middle + right)) */
  protected readonly col2SeparatorPercent =
    this.shellLayout.col2SeparatorPercent;

  /** Separator position as percentage for row resizer (top / total) */
  protected readonly rowSeparatorPercent = this.shellLayout.rowSeparatorPercent;

  /** Compute effective description flex: collapse to auto when panel is collapsed */
  protected readonly descriptionFlex = computed(() => {
    const panel = this.descriptionPanel();
    return this.shellLayout.descriptionFlex(panel?.collapsed() ?? false);
  });

  /** Compute effective top row flex: if both editor+preview are collapsed, row shrinks */
  protected readonly topRowFlex = computed(() => {
    const editor = this.editorPanel();
    const preview = this.previewPanel();
    return this.shellLayout.topRowFlex(
      editor?.collapsed() ?? false,
      preview?.collapsed() ?? false,
    );
  });

  /** Compute effective bottom row flex: if both tree+feedback are collapsed, row shrinks */
  protected readonly bottomRowFlex = computed(() => {
    const tree = this.treePanel();
    const feedback = this.feedbackPanel();
    return this.shellLayout.bottomRowFlex(
      tree?.collapsed() ?? false,
      feedback?.collapsed() ?? false,
    );
  });

  protected readonly accessibilityTree = computed<AccessibilityNode | null>(
    () =>
      this.pipeline.analysisResult()?.accessibilityAnalysis?.treeNodes ?? null,
  );

  protected readonly sandboxPageTitle = signal<string | null>(null);

  /** Iframe element reference passed to the ColorContrastPanel for sending messages. */
  protected readonly previewIframe = signal<HTMLIFrameElement | null>(null);

  /** Live preview document, exposed to the virtual screen reader. */
  protected readonly sandboxDocument = signal<Document | null>(null);

  /** The currently focused element inside the preview iframe. */
  protected readonly previewFocusedElement = signal<Element | null>(null);

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

  constructor() {
    effect(() => {
      const challenge = this.challenge();
      for (const fileType of EDITOR_FILE_TYPES) {
        this.contentSignals[fileType.id].set(challenge.starter[fileType.id]);
      }
      this.feedbackVisible.set(false);
      this.solutionRevealed.set(false);
      this.isPeeked.set(false);
      this.solutionAnnouncement.set('');
      this.revealError.set('');
      this.diffViewActive.set(false);
      this.viewModeAnnouncement.set('');
      this.pipeline.setChallenge(challenge);
      this.pipeline.updateCode(
        challenge.starter.html,
        challenge.starter.js,
        challenge.starter.css,
      );

      // Load completed and peeked status for this challenge
      this.progressStore.loadProgress().then((progress) => {
        this.challengeCompleted.set(
          progress.completedChallenges.includes(challenge.id),
        );
        this.isPeeked.set(
          (progress.peekedChallenges ?? []).includes(challenge.id),
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

    // Auto-open diff view when solution is revealed
    effect(() => {
      if (this.solutionRevealed()) {
        this.diffViewActive.set(true);
        this.viewModeAnnouncement.set('Switched to diff view');
      }
    });
  }

  protected revealSolution(): void {
    try {
      const challenge = this.challenge();
      if (!challenge.solution) {
        this.revealError.set(
          'Solution could not be loaded. The solution file may be missing or unavailable.',
        );
        return;
      }

      const solution = challenge.solution;
      if (EDITOR_FILE_TYPES.every((t) => solution[t.id] == null)) {
        this.revealError.set(
          'Solution data appears to be empty or corrupt. Please try again.',
        );
        return;
      }

      this.revealError.set('');

      // Save the user's current code before overwriting with solution
      this.userSnapshot = Object.fromEntries(
        EDITOR_FILE_TYPES.map((t) => [t.id, this.contentSignals[t.id]()]),
      ) as Record<EditorFileType, string>;
      this.hasUserSnapshot.set(true);

      // Only overwrite editor tabs where the solution provides content.
      // If a solution doesn't specify e.g. CSS, keep the current (starter) CSS.
      for (const fileType of EDITOR_FILE_TYPES) {
        const solutionValue = solution[fileType.id];
        if (solutionValue) {
          this.contentSignals[fileType.id].set(solutionValue);
        }
      }
      this.solutionRevealed.set(true);
      this.feedbackVisible.set(false);
      this.pipeline.updateCode(
        this.htmlContent(),
        this.jsContent(),
        this.cssContent(),
      );
      this.solutionAnnouncement.set('Solution revealed');
      // No syncEditorValues() call here — the auto-open effect will
      // immediately switch to diff view, so regular editors are about
      // to be destroyed and diff editors will initialize from signals.
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      this.revealError.set(`Failed to load solution: ${message}`);
    }
  }

  protected retryReveal(): void {
    this.revealError.set('');
    this.revealSolution();
  }

  protected resetToStarter(): void {
    const challenge = this.challenge();
    // Deactivate diff view first — normal editors will re-create with
    // correct values from signal bindings once Angular re-renders the @if.
    const wasDiffView = this.diffViewActive();
    this.diffViewActive.set(false);
    this.viewModeAnnouncement.set('');

    for (const fileType of EDITOR_FILE_TYPES) {
      this.contentSignals[fileType.id].set(challenge.starter[fileType.id]);
    }
    this.solutionRevealed.set(false);
    this.feedbackVisible.set(false);
    this.revealError.set('');
    this.userSnapshot = null;
    this.hasUserSnapshot.set(false);
    this.pipeline.updateCode(
      challenge.starter.html,
      challenge.starter.js,
      challenge.starter.css,
    );
    this.solutionAnnouncement.set('');

    // Only sync editors if we were NOT in diff mode. When transitioning
    // from diff to normal view, the normal editors will be re-created by
    // Angular and initialize with the correct signal values automatically.
    if (!wasDiffView) {
      this.syncEditorValues();
    }
  }

  protected restoreUserCode(): void {
    if (!this.userSnapshot) return;
    // Deactivate diff view first — normal editors will re-create with
    // correct values from signal bindings once Angular re-renders the @if.
    const wasDiffView = this.diffViewActive();
    this.diffViewActive.set(false);
    this.viewModeAnnouncement.set('');

    for (const fileType of EDITOR_FILE_TYPES) {
      this.contentSignals[fileType.id].set(this.userSnapshot[fileType.id]);
    }
    this.solutionRevealed.set(false);
    this.feedbackVisible.set(false);
    this.pipeline.updateCode(
      this.userSnapshot.html,
      this.userSnapshot.js,
      this.userSnapshot.css,
    );
    this.solutionAnnouncement.set('');

    if (!wasDiffView) {
      this.syncEditorValues();
    }
  }

  protected onResizeCol1(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridWidth =
      el.querySelector('.shell-grid')?.clientWidth ?? el.clientWidth;
    this.shellLayout.resizeCol1(delta, gridWidth);
  }

  protected onResizeCol2(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridWidth =
      el.querySelector('.shell-grid')?.clientWidth ?? el.clientWidth;
    this.shellLayout.resizeCol2(delta, gridWidth);
  }

  protected onResizeRow(delta: number): void {
    const el = this.hostRef.nativeElement as HTMLElement;
    const gridHeight =
      el.querySelector('.shell-grid')?.clientHeight ?? el.clientHeight;
    this.shellLayout.resizeRow(delta, gridHeight);
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

  protected onVttContentChange(content: string): void {
    this.vttContent.set(content);
    this.feedbackVisible.set(false);
  }

  protected onDomReady(): void {
    const doc = this.getSandboxDocument();
    if (doc) {
      this.pipeline.setSandboxDocument(doc);
      this.pipeline.runTreeAnalysis(doc);
      this.sandboxPageTitle.set(doc.title || null);
      this.sandboxDocument.set(doc);
      this.srRevision.update((value) => value + 1);
      this.previewFocusedElement.set(null);
    }

    // Capture iframe reference for the color contrast panel
    const host = this.hostRef.nativeElement as HTMLElement;
    const iframe = host.querySelector(
      '.shell-preview iframe',
    ) as HTMLIFrameElement | null;
    this.previewIframe.set(iframe);
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

      // Track the focused element for VSR focus sync
      const activeEl = doc.activeElement;
      if (
        activeEl &&
        activeEl !== doc.body &&
        activeEl !== doc.documentElement
      ) {
        this.previewFocusedElement.set(activeEl);
      } else {
        this.previewFocusedElement.set(null);
      }
    }
  }

  protected readonly editorTabs = computed<EditorFileType[]>(() => {
    const challenge = this.challenge();
    return EDITOR_FILE_TYPES.filter(
      (fileType) => fileType.alwaysVisible || challenge.starter[fileType.id],
    ).map((fileType) => fileType.id);
  });

  protected switchEditorTab(tab: EditorFileType): void {
    this.activeEditorTab.set(tab);
    if (this.layoutStore.layout().collapsed.editor) {
      this.layoutStore.setPanelCollapsed('editor', false);
    }
  }

  protected toggleDiffView(): void {
    const newState = !this.diffViewActive();
    this.diffViewActive.set(newState);
    this.viewModeAnnouncement.set(
      newState ? 'Switched to diff view' : 'Switched to code editor',
    );
  }

  protected onDiffModifiedChange(event: {
    language: string;
    content: string;
  }): void {
    switch (event.language) {
      case 'html':
        this.onHtmlContentChange(event.content);
        break;
      case 'js':
        this.onJsContentChange(event.content);
        break;
      case 'css':
        this.onCssContentChange(event.content);
        break;
      case 'vtt':
        this.onVttContentChange(event.content);
        break;
    }
  }

  protected switchTreeTab(tab: TreeTab): void {
    this.layoutStore.setActiveTreeTab(tab);
    if (this.layoutStore.layout().collapsed.tree) {
      this.layoutStore.setPanelCollapsed('tree', false);
    }
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

  protected updateScreenReaderTabOrderEnabled(enabled: boolean): void {
    this.layoutStore.setScreenReaderTabOrderEnabled(enabled);
  }

  protected openPreviewInNewTab(): void {
    const html = this.htmlContent();
    const js = this.jsContent();
    const css = this.cssContent();
    const vtt = this.vttContent();
    const vttScript = vtt
      ? `<script>(function() { var vttContent = ${JSON.stringify(vtt)}; var blob = new Blob([vttContent], { type: 'text/vtt' }); var blobUrl = URL.createObjectURL(blob); document.querySelectorAll('track[src]').forEach(function(track) { if (track.getAttribute('src').endsWith('.vtt')) { track.setAttribute('src', blobUrl); } }); })();</script>`
      : '';
    const srcdoc = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}${vttScript}<script>${js}</script></body></html>`;
    const blob = new Blob([srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  /**
   * Force-syncs the Monaco editor instances with the current signal values.
   * Required because ng-catbee/monaco-editor does not automatically call
   * editor.setValue() when the model signal is updated externally.
   * Uses the global Monaco API since editors inside @defer blocks
   * are not reliably accessible via viewChildren.
   */
  private syncEditorValues(): void {
    // In diff view mode, the diff editor binds via [model] input and
    // manages its own content. Calling getEditors() would return diff
    // sub-editors whose positional mapping doesn't match editorTabs(),
    // leading to content being written to the wrong editor/signal.
    if (this.diffViewActive()) return;

    const editors = (
      globalThis as unknown as {
        monaco?: {
          editor?: {
            getEditors?: () => {
              getValue: () => string;
              setValue: (v: string) => void;
            }[];
          };
        };
      }
    ).monaco?.editor?.getEditors?.();
    if (!editors) return;

    const tabOrder = this.editorTabs();

    for (let i = 0; i < editors.length && i < tabOrder.length; i++) {
      const tab = tabOrder[i];
      const newValue = this.contentSignals[tab]();

      if (editors[i].getValue() !== newValue) {
        editors[i].setValue(newValue);
      }
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
      discussionUrl: challenge.discussionUrl,
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
