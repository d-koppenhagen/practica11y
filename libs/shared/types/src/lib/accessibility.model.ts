export interface AccessibilityNodeProperty {
  key: string;
  value: string | boolean | number;
}

export interface AccessibilityNode {
  role: string;
  name?: string;
  level?: number;
  properties?: AccessibilityNodeProperty[];
  children: AccessibilityNode[];
}

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: AxeViolationNode[];
}

export interface AxeViolationNode {
  html: string;
  target: string[];
  failureSummary: string;
}

export interface KeyboardAnalysisResult {
  focusableElements: FocusableElement[];
  tabOrder: string[];
  nonFocusableInteractive: string[];
}

export interface FocusableElement {
  selector: string;
  role: string;
  tabIndex: number;
  isInteractive: boolean;
}

export interface FocusAnalysisResult {
  focusTraps: string[];
  hiddenFocusable: string[];
  focusOrder: string[];
}

export interface AccessibilityAnalysisResult {
  axeResults: AxeViolation[];
  treeNodes: AccessibilityNode;
  keyboardResults: KeyboardAnalysisResult;
  focusResults: FocusAnalysisResult;
  /** Raw HTML source from the editor (for syntax validation) */
  sourceHtml?: string;
}
