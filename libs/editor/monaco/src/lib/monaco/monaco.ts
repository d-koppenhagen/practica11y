import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  ElementRef,
  viewChild,
  DestroyRef,
  inject,
  afterNextRender,
} from '@angular/core';
import { ThemeService } from '@practica11y/util';
import type * as MonacoEditorApi from 'monaco-editor';

@Component({
  selector: 'a11y-monaco-editor',
  imports: [],
  templateUrl: './monaco.html',
  styleUrl: './monaco.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Monaco {
  readonly language = input<'html' | 'css' | 'javascript'>('html');
  readonly initialContent = input<string>('');
  readonly content = output<string>();

  private editorContent = signal<string>('');
  readonly currentContent = this.editorContent.asReadonly();

  private readonly editorContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');

  private editor: MonacoEditorApi.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof MonacoEditorApi | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);
  private editorReady = false;

  constructor() {
    afterNextRender(() => {
      this.loadMonacoEditor();
    });

    effect(() => {
      const lang = this.language();
      if (this.editor && this.monaco && this.editorReady) {
        const model = this.editor.getModel();
        if (model) {
          this.monaco.editor.setModelLanguage(model, lang);
        }
      }
    });

    effect(() => {
      const content = this.initialContent();
      if (this.editor && this.editorReady) {
        const currentValue = this.editor.getValue();
        if (currentValue !== content) {
          this.editor.setValue(content);
        }
      }
    });

    effect(() => {
      const theme = this.themeService.theme();
      if (this.monaco && this.editorReady) {
        this.monaco.editor.setTheme(theme === 'dark' ? 'hc-black' : 'hc-light');
      }
    });

    this.destroyRef.onDestroy(() => {
      this.disposeEditor();
    });
  }

  private async loadMonacoEditor(): Promise<void> {
    try {
      const monaco = await import('monaco-editor');
      this.monaco = monaco;
      this.createEditor(monaco);
    } catch (error) {
      console.error('Failed to load Monaco Editor:', error);
    }
  }

  private createEditor(monaco: typeof MonacoEditorApi): void {
    const container = this.editorContainer().nativeElement;

    this.editor = monaco.editor.create(container, {
      value: this.initialContent(),
      language: this.language(),
      theme: this.themeService.theme() === 'dark' ? 'hc-black' : 'hc-light',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      tabSize: 2,
      accessibilitySupport: 'on',
      ariaLabel: 'Code Editor',
    });

    this.editorReady = true;

    this.editor.onDidChangeModelContent(() => {
      const value = this.editor?.getValue() ?? '';
      this.editorContent.set(value);
      this.content.emit(value);
    });
  }

  private disposeEditor(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.editorReady = false;
  }
}
