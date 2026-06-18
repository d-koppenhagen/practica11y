/**
 * Message types for parent <-> iframe communication.
 */
export interface DomReadyMessage {
  type: 'dom-ready';
}

export interface RunAnalysisMessage {
  type: 'run-analysis';
}

export interface AxeResultMessage {
  type: 'axe-result';
  payload: AxeViolationPayload[];
}

export interface AxeErrorMessage {
  type: 'axe-error';
  payload: { message: string };
}

export interface AxeViolationPayload {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: { html: string; target: string[]; failureSummary: string }[];
}

export type SandboxMessage =
  | DomReadyMessage
  | RunAnalysisMessage
  | AxeResultMessage
  | AxeErrorMessage;
