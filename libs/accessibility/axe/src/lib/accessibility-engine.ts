import { inject, Injectable } from '@angular/core';
import { AccessibilityAnalysisResult } from '@practica11y/types';
import { TreeGenerator } from '@practica11y/tree';
import { KeyboardAnalysis } from '@practica11y/keyboard';
import { FocusAnalysis } from '@practica11y/focus';
import { AxeAnalyzer } from './axe/axe';

export interface LocalAnalysisResult {
  treeNodes: AccessibilityAnalysisResult['treeNodes'];
  keyboardResults: AccessibilityAnalysisResult['keyboardResults'];
  focusResults: AccessibilityAnalysisResult['focusResults'];
}

@Injectable({ providedIn: 'root' })
export class AccessibilityEngine {
  private readonly axeAnalyzer = inject(AxeAnalyzer);
  private readonly treeGenerator = inject(TreeGenerator);
  private readonly keyboardAnalysis = inject(KeyboardAnalysis);
  private readonly focusAnalysis = inject(FocusAnalysis);

  /**
   * Runs the full analysis including axe-core.
   * @deprecated Prefer analyzeLocal() + iframe-based axe for accurate results.
   */
  async analyze(document: Document): Promise<AccessibilityAnalysisResult> {
    const [axeResults, treeNodes, keyboardResults, focusResults] =
      await Promise.all([
        this.axeAnalyzer.run(document),
        Promise.resolve(this.treeGenerator.generate(document.documentElement)),
        Promise.resolve(this.keyboardAnalysis.analyze(document)),
        Promise.resolve(this.focusAnalysis.analyze(document)),
      ]);

    return { axeResults, treeNodes, keyboardResults, focusResults };
  }

  /**
   * Runs local analysis (tree, keyboard, focus) without axe-core.
   * Axe-core runs inside the iframe and posts results via postMessage.
   */
  analyzeLocal(document: Document): LocalAnalysisResult {
    const userContent =
      document.getElementById('user-content') ?? document.body;
    const treeNodes = this.treeGenerator.generate(userContent);
    const keyboardResults = this.keyboardAnalysis.analyze(document);
    const focusResults = this.focusAnalysis.analyze(document);

    return { treeNodes, keyboardResults, focusResults };
  }
}
