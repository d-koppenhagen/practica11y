import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Tabs, TabList, Tab } from '@angular/aria/tabs';

export type EditorTab = 'html' | 'js' | 'css' | 'vtt';

@Component({
  selector: 'a11y-editor-tabs',
  imports: [UpperCasePipe, Tabs, TabList, Tab],
  templateUrl: './editor-tabs.html',
  styleUrl: './editor-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorTabs {
  /** Available tabs determined by starter content (e.g., no JS → no JS tab) */
  readonly tabs = input.required<EditorTab[]>();

  /** Currently active tab */
  readonly activeTab = input.required<EditorTab>();

  /** Emits when a tab is activated by click or keyboard */
  readonly tabActivated = output<EditorTab>();

  protected onSelectedTabChange(tab: string | undefined): void {
    if (tab) {
      this.tabActivated.emit(tab as EditorTab);
    }
  }
}
