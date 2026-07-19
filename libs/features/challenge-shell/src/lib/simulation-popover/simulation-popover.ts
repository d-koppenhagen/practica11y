import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import {
  CdkOverlayOrigin,
  CdkConnectedOverlay,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { Menu, MenuItem } from '@angular/aria/menu';
import {
  PreferenceSimulationStore,
  type ColorSchemePreference,
  type ContrastPreference,
  type ReducedMotionPreference,
} from '@practica11y/util';

@Component({
  selector: 'a11y-simulation-popover',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, Menu, MenuItem],
  templateUrl: './simulation-popover.html',
  styleUrl: './simulation-popover.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'simulation-popover-host' },
})
export class SimulationPopover {
  private readonly store = inject(PreferenceSimulationStore);

  protected readonly triggerRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerBtn');

  protected readonly isOpen = signal(false);
  protected readonly reducedMotion = this.store.reducedMotion;
  protected readonly colorScheme = this.store.colorScheme;
  protected readonly contrast = this.store.contrast;

  /** Position the panel below-end with fallback to above-end */
  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.triggerRef().nativeElement.focus();
  }

  protected handleItemSelected(value: string): void {
    const [group, val] = value.split(':');
    switch (group) {
      case 'motion':
        this.store.setReducedMotion(val as ReducedMotionPreference);
        break;
      case 'scheme':
        this.store.setColorScheme(val as ColorSchemePreference);
        break;
      case 'contrast':
        this.store.setContrast(val as ContrastPreference);
        break;
    }
  }
}
