import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ElementRef,
  inject,
  NgZone,
} from '@angular/core';

export type ResizerOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'a11y-shell-resizer',
  template: `<div
    class="resizer-handle"
    role="separator"
    [attr.aria-orientation]="orientation()"
    [attr.aria-valuenow]="valueNow()"
    [attr.aria-valuemin]="valueMin()"
    [attr.aria-valuemax]="valueMax()"
    aria-label="Resize"
    tabindex="0"
    (keydown)="onKeydown($event)"
  ></div>`,
  styleUrl: './shell-resizer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.resizer-vertical]': 'orientation() === "vertical"',
    '[class.resizer-horizontal]': 'orientation() === "horizontal"',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ShellResizer {
  /** 'vertical' = draggable left/right (column divider), 'horizontal' = draggable up/down (row divider) */
  readonly orientation = input<ResizerOrientation>('vertical');

  /** Current separator position as percentage (0–100) */
  readonly valueNow = input(50);

  /** Minimum value for the separator position */
  readonly valueMin = input(0);

  /** Maximum value for the separator position */
  readonly valueMax = input(100);

  /** Emits delta in pixels while dragging */
  readonly resized = output<number>();

  private readonly zone = inject(NgZone);
  private readonly elRef = inject(ElementRef);

  private startPos = 0;
  private dragging = false;

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.dragging = true;
    this.startPos =
      this.orientation() === 'vertical' ? event.clientX : event.clientY;

    const el = this.elRef.nativeElement as HTMLElement;
    el.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      if (!this.dragging) return;
      const currentPos =
        this.orientation() === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - this.startPos;
      this.startPos = currentPos;
      this.zone.run(() => this.resized.emit(delta));
    };

    const onUp = (e: PointerEvent) => {
      this.dragging = false;
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = 20;
    const isVertical = this.orientation() === 'vertical';

    if (isVertical && event.key === 'ArrowRight') {
      event.preventDefault();
      this.resized.emit(step);
    } else if (isVertical && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.resized.emit(-step);
    } else if (!isVertical && event.key === 'ArrowDown') {
      event.preventDefault();
      this.resized.emit(step);
    } else if (!isVertical && event.key === 'ArrowUp') {
      event.preventDefault();
      this.resized.emit(-step);
    }
  }
}
