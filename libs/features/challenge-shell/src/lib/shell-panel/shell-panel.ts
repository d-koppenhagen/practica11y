import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';

export type CollapseDirection = 'vertical' | 'horizontal';

/** Viewport below which the mobile collapse direction applies. */
const MOBILE_QUERY = '(max-width: 1023px)';

@Component({
  selector: 'a11y-shell-panel',
  templateUrl: './shell-panel.html',
  styleUrl: './shell-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.panel-collapsed]': 'collapsed()',
    '[class.panel-collapse-vertical]':
      'effectiveCollapseDirection() === "vertical"',
    '[class.panel-collapse-horizontal]':
      'effectiveCollapseDirection() === "horizontal"',
  },
})
export class ShellPanel {
  readonly scrollBody = input(true);
  readonly collapsible = input(false);
  readonly panelLabel = input<string>('');
  /** Direction the panel collapses in: 'vertical' shrinks height, 'horizontal' shrinks width */
  readonly collapseDirection = input<CollapseDirection>('vertical');
  /** Collapse direction used on mobile viewports, where panels are stacked. */
  readonly collapseDirectionMobile = input<CollapseDirection>('vertical');

  readonly collapsed = signal(false);

  private readonly isMobile = signal(false);

  /** Resolves the active collapse direction based on the current viewport. */
  protected readonly effectiveCollapseDirection = computed<CollapseDirection>(
    () =>
      this.isMobile()
        ? this.collapseDirectionMobile()
        : this.collapseDirection(),
  );

  protected readonly ariaExpanded = computed(() => !this.collapsed());

  constructor() {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      const mql = window.matchMedia(MOBILE_QUERY);
      this.isMobile.set(mql.matches);

      const onChange = (event: MediaQueryListEvent) =>
        this.isMobile.set(event.matches);
      mql.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() =>
        mql.removeEventListener('change', onChange),
      );
    }
  }

  protected toggleCollapse(): void {
    this.collapsed.set(!this.collapsed());
  }
}
