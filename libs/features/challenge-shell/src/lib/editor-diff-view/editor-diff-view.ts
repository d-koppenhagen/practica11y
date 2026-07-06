import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import {
  CatbeeMonacoDiffEditor,
  CatbeeMonacoDiffEditorEvent,
  MonacoEditorOptions,
} from '@ng-catbee/monaco-editor';
import type { EditorFileType } from '@practica11y/editor-types';

export interface DiffLanguageEntry {
  language: EditorFileType;
  label: string;
  monacoLanguage: string;
  original: string;
  modified: string;
}

@Component({
  selector: 'a11y-editor-diff-view',
  imports: [CatbeeMonacoDiffEditor],
  templateUrl: './editor-diff-view.html',
  styleUrl: './editor-diff-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorDiffView {
  /** Diff entries for each available language */
  readonly entries = input.required<DiffLanguageEntry[]>();

  /** Monaco editor options (theme, etc.) */
  readonly editorOptions = input<MonacoEditorOptions>({});

  /** Emits when the modified side changes for a language */
  readonly modifiedChange = output<{ language: string; content: string }>();

  protected onDiffUpdate(
    language: string,
    event: CatbeeMonacoDiffEditorEvent,
  ): void {
    this.modifiedChange.emit({ language, content: event.modified });
  }
}
