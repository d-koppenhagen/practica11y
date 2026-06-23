import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { TreeTab } from '@practica11y/util';
import { Tabs, TabList, Tab } from '@angular/aria/tabs';

interface TreeTabConfig {
  id: TreeTab;
  label: string;
}

const TREE_TABS: TreeTabConfig[] = [
  { id: 'tree', label: 'Accessibility Tree' },
  { id: 'screen-reader', label: 'Virtual Screen Reader' },
  { id: 'color-contrast', label: 'Color Contrast' },
];

@Component({
  selector: 'a11y-investigation-tool-tabs',
  imports: [Tabs, TabList, Tab],
  templateUrl: './investigation-tool-tabs.html',
  styleUrl: './investigation-tool-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestigationToolTabs {
  readonly activeTab = input.required<TreeTab>();
  readonly tabActivated = output<TreeTab>();

  protected readonly tabs = TREE_TABS;

  protected onSelectedTabChange(tab: string | undefined): void {
    if (tab) {
      this.tabActivated.emit(tab as TreeTab);
    }
  }
}
