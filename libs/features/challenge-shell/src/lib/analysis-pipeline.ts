import { inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

import { AccessibilityEngine } from '@practica11y/axe';
import { Challenge, ValidationResult } from '@practica11y/models';
import {
  AccessibilityAnalysisResult,
  AnalysisPipelineResult,
  AxeViolation,
} from '@practica11y/types';
import { Gamification, ProgressStore, SyncStore } from '@practica11y/util';
import {
  ChallengeValidator,
  axeNoViolations,
  hasLandmarks,
  hasAllLandmarks,
  hasSkipLink,
  buttonLinkSemantics,
  focusAfterNavigation,
  headingStructure,
  formLabels,
  colorContrast,
  semanticButton,
  keyboardAccessible,
  imageAltText,
  focusTrapImplemented,
  validHtmlSyntax,
  pageTitle,
  imageAltTextLimit,
  imageAriaDescribedby,
  reducedMotion,
  prefersColorScheme,
  prefersContrast,
  progressbarAccessible,
  ariaInvalidErrors,
  errorFocusManagement,
  videoHasCaptions,
  liveRegionPattern,
  noDisabledSubmit,
  focusVisible,
  interactiveElementName,
  documentLanguage,
  noLayoutTable,
  semanticTableStructure,
  autocompleteAttributes,
  targetSizeMinimum,
  noPositiveTabindex,
  skeletonAriaHidden,
  focusReturnAfterDialog,
  uniqueButtonLabels,
  labelInName,
  ariaOverload,
  sectionAccessibleName,
  infiniteScrollBypass,
} from '@practica11y/validators';

interface CodeChange {
  htmlContent: string;
  jsContent: string;
  cssContent: string;
}

@Injectable()
export class AnalysisPipeline {
  private readonly accessibilityEngine = inject(AccessibilityEngine);
  private readonly challengeValidator = inject(ChallengeValidator);
  private readonly gamification = inject(Gamification);
  private readonly progressStore = inject(ProgressStore);
  private readonly syncStore = inject(SyncStore);

  private readonly codeChange = signal<CodeChange>({
    htmlContent: '',
    jsContent: '',
    cssContent: '',
  });
  private readonly currentChallenge = signal<Challenge | null>(null);
  private readonly sandboxDocument = signal<Document | null>(null);

  readonly analysisResult = signal<AnalysisPipelineResult | null>(null);
  readonly isAnalyzing = signal<boolean>(false);

  private isRunning = false;

  constructor() {
    // Register all available validators
    this.challengeValidator.registerValidator(validHtmlSyntax);
    this.challengeValidator.registerValidator(axeNoViolations);
    this.challengeValidator.registerValidator(hasLandmarks);
    this.challengeValidator.registerValidator(hasAllLandmarks);
    this.challengeValidator.registerValidator(hasSkipLink);
    this.challengeValidator.registerValidator(buttonLinkSemantics);
    this.challengeValidator.registerValidator(focusAfterNavigation);
    this.challengeValidator.registerValidator(headingStructure);
    this.challengeValidator.registerValidator(formLabels);
    this.challengeValidator.registerValidator(colorContrast);
    this.challengeValidator.registerValidator(semanticButton);
    this.challengeValidator.registerValidator(keyboardAccessible);
    this.challengeValidator.registerValidator(imageAltText);
    this.challengeValidator.registerValidator(focusTrapImplemented);
    this.challengeValidator.registerValidator(pageTitle);
    this.challengeValidator.registerValidator(imageAltTextLimit);
    this.challengeValidator.registerValidator(imageAriaDescribedby);
    this.challengeValidator.registerValidator(reducedMotion);
    this.challengeValidator.registerValidator(prefersColorScheme);
    this.challengeValidator.registerValidator(prefersContrast);
    this.challengeValidator.registerValidator(progressbarAccessible);
    this.challengeValidator.registerValidator(ariaInvalidErrors);
    this.challengeValidator.registerValidator(errorFocusManagement);
    this.challengeValidator.registerValidator(videoHasCaptions);
    this.challengeValidator.registerValidator(liveRegionPattern);
    this.challengeValidator.registerValidator(noDisabledSubmit);
    this.challengeValidator.registerValidator(focusVisible);
    this.challengeValidator.registerValidator(interactiveElementName);
    this.challengeValidator.registerValidator(documentLanguage);
    this.challengeValidator.registerValidator(noLayoutTable);
    this.challengeValidator.registerValidator(semanticTableStructure);
    this.challengeValidator.registerValidator(autocompleteAttributes);
    this.challengeValidator.registerValidator(targetSizeMinimum);
    this.challengeValidator.registerValidator(noPositiveTabindex);
    this.challengeValidator.registerValidator(skeletonAriaHidden);
    this.challengeValidator.registerValidator(focusReturnAfterDialog);
    this.challengeValidator.registerValidator(uniqueButtonLabels);
    this.challengeValidator.registerValidator(labelInName);
    this.challengeValidator.registerValidator(ariaOverload);
    this.challengeValidator.registerValidator(sectionAccessibleName);
    this.challengeValidator.registerValidator(infiniteScrollBypass);
  }

  /** Debounced code change signal (300ms) */
  readonly debouncedCodeChange = toSignal(
    toObservable(this.codeChange).pipe(debounceTime(300)),
    { initialValue: { htmlContent: '', jsContent: '', cssContent: '' } },
  );

  /**
   * Sets the active challenge for validation and gamification.
   */
  setChallenge(challenge: Challenge): void {
    this.currentChallenge.set(challenge);
  }

  /**
   * Sets the sandbox document reference used for accessibility analysis.
   */
  setSandboxDocument(doc: Document): void {
    this.sandboxDocument.set(doc);
  }

  /**
   * Notifies the pipeline of a code change. The change is debounced internally.
   */
  updateCode(htmlContent: string, jsContent: string, cssContent: string): void {
    this.codeChange.set({ htmlContent, jsContent, cssContent });
  }

  /**
   * Runs only the tree analysis on the document.
   * Called automatically on code changes via onDomReady.
   * Does NOT run validators or trigger gamification.
   */
  runTreeAnalysis(doc: Document): void {
    const localAnalysis = this.accessibilityEngine.analyzeLocal(doc);
    const currentResult = this.analysisResult();

    const accessibilityAnalysis: AccessibilityAnalysisResult = {
      axeResults: currentResult?.accessibilityAnalysis?.axeResults ?? [],
      treeNodes: localAnalysis.treeNodes,
      keyboardResults: localAnalysis.keyboardResults,
      focusResults: localAnalysis.focusResults,
      sourceHtml: this.codeChange().htmlContent,
    };

    this.analysisResult.set({
      validationResults: currentResult?.validationResults ?? [],
      accessibilityAnalysis,
      challengeCompleted: currentResult?.challengeCompleted ?? false,
      timestamp: currentResult?.timestamp ?? Date.now(),
    });
  }

  /**
   * Runs the full validation pipeline including validators and axe-core.
   * Only called in response to explicit user action (Check Solution button).
   *
   * NOTE: Does NOT determine challengeCompleted here because axe results
   * are not yet available. The final determination happens in setAxeResults()
   * once the iframe delivers the axe-core results.
   */
  async runValidation(doc: Document): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isAnalyzing.set(true);

    try {
      const localAnalysis = this.accessibilityEngine.analyzeLocal(doc);

      const accessibilityAnalysis: AccessibilityAnalysisResult = {
        axeResults: [],
        treeNodes: localAnalysis.treeNodes,
        keyboardResults: localAnalysis.keyboardResults,
        focusResults: localAnalysis.focusResults,
        sourceHtml: this.codeChange().htmlContent,
      };

      // Store partial result — challengeCompleted stays false until axe results arrive
      this.analysisResult.set({
        validationResults: [],
        accessibilityAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      });
    } finally {
      this.isRunning = false;
      // isAnalyzing stays true until setAxeResults completes
    }
  }

  /**
   * Runs the local analysis pipeline (tree, keyboard, focus)
   * using the iframe's contentDocument. Axe results are provided separately
   * from the iframe via postMessage.
   *
   * 1. Run local accessibility analysis (tree, keyboard, focus) on the document
   * 2. Request axe analysis from iframe (handled externally)
   * 3. When axe results arrive, call setAxeResults() to finalize
   *
   * NOTE: Does NOT run validators or determine challengeCompleted here.
   * Final validation happens in setAxeResults() once axe data arrives.
   */
  async runLocalAnalysis(doc: Document): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isAnalyzing.set(true);

    try {
      // Run local analysis (tree, keyboard, focus — NOT axe)
      const localAnalysis = this.accessibilityEngine.analyzeLocal(doc);

      // Store partial result with empty axe results for now
      const accessibilityAnalysis: AccessibilityAnalysisResult = {
        axeResults: [],
        treeNodes: localAnalysis.treeNodes,
        keyboardResults: localAnalysis.keyboardResults,
        focusResults: localAnalysis.focusResults,
        sourceHtml: this.codeChange().htmlContent,
      };

      // Store partial result — challengeCompleted stays false until axe results arrive
      this.analysisResult.set({
        validationResults: [],
        accessibilityAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      });
    } finally {
      this.isRunning = false;
      // Keep isAnalyzing true — we're waiting for axe results from iframe
    }
  }

  /**
   * Lightweight tree-only update for interaction state changes (input values, focus).
   * Does NOT re-run validators or axe — just regenerates the tree.
   * Preserves the existing timestamp so that the success dialog is not re-triggered.
   */
  updateTreeOnly(doc: Document): void {
    const currentResult = this.analysisResult();
    if (!currentResult) return;

    const treeNodes = this.accessibilityEngine.analyzeLocal(doc).treeNodes;

    this.analysisResult.set({
      ...currentResult,
      accessibilityAnalysis: {
        ...currentResult.accessibilityAnalysis,
        treeNodes,
      },
    });
  }

  /**
   * Merges axe results received from the iframe into the current analysis.
   * Only re-runs validators when called in the context of an explicit validation
   * (i.e., isAnalyzing is true, meaning runValidation() was called).
   * Otherwise, just stores the axe data without re-validation.
   */
  async setAxeResults(axeResults: AxeViolation[]): Promise<void> {
    const currentResult = this.analysisResult();
    const doc = this.sandboxDocument();
    if (!currentResult || !doc) {
      this.isAnalyzing.set(false);
      return;
    }

    // If not in an explicit validation context, just store axe data
    if (!this.isAnalyzing()) {
      this.analysisResult.set({
        ...currentResult,
        accessibilityAnalysis: {
          ...currentResult.accessibilityAnalysis,
          axeResults,
        },
        timestamp: Date.now(),
      });
      return;
    }

    try {
      // Full validation path (explicit trigger)
      const accessibilityAnalysis: AccessibilityAnalysisResult = {
        ...currentResult.accessibilityAnalysis,
        axeResults,
      };

      // Re-run validators with complete data (including axe results)
      const challenge = this.currentChallenge();
      let validationResults: ValidationResult[] = [];

      if (challenge) {
        validationResults = await this.challengeValidator.validateChallenge(
          doc,
          ['valid-html-syntax', ...challenge.validatorIds],
          accessibilityAnalysis,
        );
      }

      const challengeCompleted =
        validationResults.length > 0 &&
        validationResults.every((r) => r.passed);

      const result: AnalysisPipelineResult = {
        validationResults,
        accessibilityAnalysis,
        challengeCompleted,
        timestamp: Date.now(),
      };

      this.analysisResult.set(result);

      if (challengeCompleted && challenge) {
        await this.handleChallengeCompletion(challenge);
      }
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  /**
   * @deprecated Use runLocalAnalysis() + setAxeResults() instead.
   * Kept for backward compatibility with tests.
   */
  async runPipeline(doc: Document): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isAnalyzing.set(true);

    try {
      // 1. Run accessibility analysis
      const accessibilityAnalysis = await this.accessibilityEngine.analyze(doc);

      // 2. Run validators
      const challenge = this.currentChallenge();
      let validationResults: ValidationResult[] = [];

      if (challenge) {
        validationResults = await this.challengeValidator.validateChallenge(
          doc,
          ['valid-html-syntax', ...challenge.validatorIds],
          accessibilityAnalysis,
        );
      }

      // 3. Determine challenge completion
      const challengeCompleted =
        validationResults.length > 0 &&
        validationResults.every((r) => r.passed);

      // 4. Build result
      const result: AnalysisPipelineResult = {
        validationResults,
        accessibilityAnalysis,
        challengeCompleted,
        timestamp: Date.now(),
      };

      this.analysisResult.set(result);

      // 5. Handle challenge completion (gamification + progress)
      if (challengeCompleted && challenge) {
        await this.handleChallengeCompletion(challenge);
      }
    } finally {
      this.isRunning = false;
      this.isAnalyzing.set(false);
    }
  }

  private async handleChallengeCompletion(challenge: Challenge): Promise<void> {
    // Check if already completed to avoid awarding XP multiple times
    const progress = await this.progressStore.loadProgress();
    if (progress.completedChallenges.includes(challenge.id)) {
      return;
    }

    // Skip XP award if the challenge was peeked (solution revealed)
    const isPeeked = progress.peekedChallenges.includes(challenge.id);

    if (!isPeeked) {
      // Award XP only for non-peeked challenges
      this.gamification.addXP(challenge.points);
    }

    // Mark challenge as completed and persist updated XP
    await this.progressStore.markChallengeCompleted(challenge.id);
    await this.progressStore.saveProgress({
      ...(await this.progressStore.loadProgress()),
      xp: this.gamification.currentXP(),
    });

    // Check for achievements
    const updatedProgress = await this.progressStore.loadProgress();
    this.gamification.checkAchievements({
      type: 'challenge_completed',
      payload: { completedCount: updatedProgress.completedChallenges.length },
    });

    // Sync progress to remote after challenge completion (Req 4.3)
    this.syncStore.sync();
  }
}
