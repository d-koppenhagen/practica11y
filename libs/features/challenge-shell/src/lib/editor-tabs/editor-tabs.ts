import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Tabs, TabList, Tab } from '@angular/aria/tabs';
import { EditorFileType } from '@practica11y/editor-types';

@Component({
  selector: 'a11y-editor-tabs',
  imports: [UpperCasePipe, Tabs, TabList, Tab],
  templateUrl: './editor-tabs.html',
  styleUrl: './editor-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorTabs {
  /** Available tabs determined by starter content (e.g., no JS → no JS tab) */
  readonly tabs = input.required<EditorFileType[]>();

  /** Currently active tab */
  readonly activeTab = input.required<EditorFileType>();

  /** Emits when a tab is activated by click or keyboard */
  readonly tabActivated = output<EditorFileType>();

  protected onSelectedTabChange(tab?: string): void {
    if (tab) {
      this.tabActivated.emit(tab as EditorFileType);
    }
  }
}
