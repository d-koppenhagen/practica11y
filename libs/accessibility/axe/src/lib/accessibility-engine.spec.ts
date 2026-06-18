import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AccessibilityEngine } from './accessibility-engine';
import { AxeAnalyzer } from './axe/axe';
import { TreeGenerator } from '@practica11y/tree';
import { KeyboardAnalysis } from '@practica11y/keyboard';
import { FocusAnalysis } from '@practica11y/focus';
import {
  AccessibilityAnalysisResult,
  AccessibilityNode,
  AxeViolation,
  FocusAnalysisResult,
  KeyboardAnalysisResult,
} from '@practica11y/types';

describe('AccessibilityEngine', () => {
  let engine: AccessibilityEngine;
  let axeAnalyzer: { run: ReturnType<typeof vi.fn> };
  let treeGenerator: { generate: ReturnType<typeof vi.fn> };
  let keyboardAnalysis: { analyze: ReturnType<typeof vi.fn> };
  let focusAnalysis: { analyze: ReturnType<typeof vi.fn> };

  const mockAxeResults: AxeViolation[] = [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
      nodes: [
        {
          html: '<span>text</span>',
          target: ['span'],
          failureSummary: 'Fix contrast',
        },
      ],
    },
  ];

  const mockTreeNodes: AccessibilityNode = {
    role: 'document',
    children: [{ role: 'heading', name: 'Hello', level: 1, children: [] }],
  };

  const mockKeyboardResults: KeyboardAnalysisResult = {
    focusableElements: [],
    tabOrder: [],
    nonFocusableInteractive: [],
  };

  const mockFocusResults: FocusAnalysisResult = {
    focusTraps: [],
    hiddenFocusable: [],
    focusOrder: [],
  };

  beforeEach(() => {
    axeAnalyzer = { run: vi.fn().mockResolvedValue(mockAxeResults) };
    treeGenerator = { generate: vi.fn().mockReturnValue(mockTreeNodes) };
    keyboardAnalysis = {
      analyze: vi.fn().mockReturnValue(mockKeyboardResults),
    };
    focusAnalysis = { analyze: vi.fn().mockReturnValue(mockFocusResults) };

    TestBed.configureTestingModule({
      providers: [
        AccessibilityEngine,
        { provide: AxeAnalyzer, useValue: axeAnalyzer },
        { provide: TreeGenerator, useValue: treeGenerator },
        { provide: KeyboardAnalysis, useValue: keyboardAnalysis },
        { provide: FocusAnalysis, useValue: focusAnalysis },
      ],
    });

    engine = TestBed.inject(AccessibilityEngine);
  });

  it('should call all four services with the document', async () => {
    await engine.analyze(document);

    expect(axeAnalyzer.run).toHaveBeenCalledWith(document);
    expect(treeGenerator.generate).toHaveBeenCalledWith(
      document.documentElement,
    );
    expect(keyboardAnalysis.analyze).toHaveBeenCalledWith(document);
    expect(focusAnalysis.analyze).toHaveBeenCalledWith(document);
  });

  it('should return a result with all four fields', async () => {
    const result: AccessibilityAnalysisResult = await engine.analyze(document);

    expect(result.axeResults).toEqual(mockAxeResults);
    expect(result.treeNodes).toEqual(mockTreeNodes);
    expect(result.keyboardResults).toEqual(mockKeyboardResults);
    expect(result.focusResults).toEqual(mockFocusResults);
  });

  it('should run all services in parallel via Promise.all', async () => {
    const callOrder: string[] = [];

    axeAnalyzer.run.mockImplementation(async () => {
      callOrder.push('axe-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('axe-end');
      return mockAxeResults;
    });

    treeGenerator.generate.mockImplementation(() => {
      callOrder.push('tree');
      return mockTreeNodes;
    });

    keyboardAnalysis.analyze.mockImplementation(() => {
      callOrder.push('keyboard');
      return mockKeyboardResults;
    });

    focusAnalysis.analyze.mockImplementation(() => {
      callOrder.push('focus');
      return mockFocusResults;
    });

    await engine.analyze(document);

    // All sync services should be called before axe resolves
    expect(callOrder.indexOf('tree')).toBeLessThan(
      callOrder.indexOf('axe-end'),
    );
    expect(callOrder.indexOf('keyboard')).toBeLessThan(
      callOrder.indexOf('axe-end'),
    );
    expect(callOrder.indexOf('focus')).toBeLessThan(
      callOrder.indexOf('axe-end'),
    );
  });
});
