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

export interface EnableColorPickerMessage {
  type: 'enable-color-picker';
}

export interface DisableColorPickerMessage {
  type: 'disable-color-picker';
}

export interface ColorPickPayload {
  foregroundColor: string; // CSS color string, e.g. "rgb(0, 0, 0)"
  backgroundColor: string; // CSS color string, e.g. "rgb(255, 255, 255)"
  fontSizePx: number; // Computed font-size in pixels
  fontWeight: number; // Numeric CSS font-weight (e.g. 400, 700)
}

export interface ColorPickResultMessage {
  type: 'color-pick-result';
  payload: ColorPickPayload;
}

export type SandboxMessage =
  | DomReadyMessage
  | RunAnalysisMessage
  | AxeResultMessage
  | AxeErrorMessage
  | EnableColorPickerMessage
  | DisableColorPickerMessage
  | ColorPickResultMessage;
