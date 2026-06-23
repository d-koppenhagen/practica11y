import { computed, inject, Injectable } from '@angular/core';
import { LayoutStore } from '@practica11y/util';

@Injectable()
export class ShellLayout {
  private readonly layoutStore = inject(LayoutStore);

  /** Column widths from the store */
  readonly colWidths = computed(() => this.layoutStore.layout().colWidths);

  /** Row heights from the store */
  readonly rowHeights = computed(() => this.layoutStore.layout().rowHeights);

  /** Collapsed panel states */
  readonly collapsed = computed(() => this.layoutStore.layout().collapsed);

  /** Separator percentage for col1 resizer: left / total */
  readonly col1SeparatorPercent = computed(() => {
    const [l, m, r] = this.colWidths();
    return Math.round((l / (l + m + r)) * 100);
  });

  /** Separator percentage for col2 resizer: middle / (middle + right) */
  readonly col2SeparatorPercent = computed(() => {
    const [, m, r] = this.colWidths();
    return Math.round((m / (m + r)) * 100);
  });

  /** Separator percentage for row resizer: top / total */
  readonly rowSeparatorPercent = computed(() => {
    const [t, b] = this.rowHeights();
    return Math.round((t / (t + b)) * 100);
  });

  /** Description flex: "0 0 auto" when collapsed, column width otherwise */
  descriptionFlex(collapsed: boolean): string {
    return collapsed ? '0 0 auto' : String(this.colWidths()[0]);
  }

  /** Top row flex: "0 0 auto" when both editor+preview collapsed */
  topRowFlex(editorCollapsed: boolean, previewCollapsed: boolean): string {
    return editorCollapsed && previewCollapsed
      ? '0 0 auto'
      : String(this.rowHeights()[0]);
  }

  /** Bottom row flex: "0 0 auto" when both tree+feedback collapsed */
  bottomRowFlex(treeCollapsed: boolean, feedbackCollapsed: boolean): string {
    return treeCollapsed && feedbackCollapsed
      ? '0 0 auto'
      : String(this.rowHeights()[1]);
  }

  /** Resize col1: convert pixel delta to fractional units, clamp to 0.5fr min */
  resizeCol1(delta: number, gridWidth: number): void {
    const [l, m, r] = this.colWidths();
    const total = l + m + r;
    const frDelta = (delta / gridWidth) * total;
    const newL = Math.max(0.5, l + frDelta);
    const newM = Math.max(0.5, m - frDelta);
    this.layoutStore.setColWidths([newL, newM, r]);
  }

  /** Resize col2: convert pixel delta to fractional units, clamp to 0.5fr min */
  resizeCol2(delta: number, gridWidth: number): void {
    const [l, m, r] = this.colWidths();
    const total = l + m + r;
    const frDelta = (delta / gridWidth) * total;
    const newM = Math.max(0.5, m + frDelta);
    const newR = Math.max(0.5, r - frDelta);
    this.layoutStore.setColWidths([l, newM, newR]);
  }

  /** Resize row: convert pixel delta to fractional units, clamp to 0.3fr min */
  resizeRow(delta: number, gridHeight: number): void {
    const [t, b] = this.rowHeights();
    const total = t + b;
    const frDelta = (delta / gridHeight) * total;
    const newT = Math.max(0.3, t + frDelta);
    const newB = Math.max(0.3, b - frDelta);
    this.layoutStore.setRowHeights([newT, newB]);
  }
}
