import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
} from '@angular/core';

export type CollapseDirection = 'vertical' | 'horizontal';

@Component({
  selector: 'a11y-shell-panel',
  templateUrl: './shell-panel.html',
  styleUrl: './shell-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.panel-collapsed]': 'collapsed()',
    '[class.panel-collapse-vertical]': 'collapseDirection() === "vertical"',
    '[class.panel-collapse-horizontal]': 'collapseDirection() === "horizontal"',
  },
})
export class ShellPanel {
  readonly scrollBody = input(true);
  readonly collapsible = input(false);
  readonly panelLabel = input<string>('');
  /** Direction the panel collapses in: 'vertical' shrinks height, 'horizontal' shrinks width */
  readonly collapseDirection = input<CollapseDirection>('vertical');

  readonly collapsed = signal(false);

  protected readonly ariaExpanded = computed(() => !this.collapsed());

  protected toggleCollapse(): void {
    this.collapsed.set(!this.collapsed());
  }
}
