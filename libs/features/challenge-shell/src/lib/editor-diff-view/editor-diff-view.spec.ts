import { Component, input, output } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { EditorDiffView, DiffLanguageEntry } from './editor-diff-view';

/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: 'ng-catbee-monaco-diff-editor',
  standalone: true,
  template:
    '<div class="mock-diff-editor" data-testid="mock-diff-editor"></div>',
})
class MockCatbeeMonacoDiffEditor {
  readonly model = input<{ original: string; modified: string }>();
  readonly language = input<string>('');
  readonly options = input<Record<string, unknown>>({});
  readonly originalEditable = input<boolean>(true);
  readonly height = input<string>('300px');
  readonly width = input<string>('100%');
  readonly editorDiffUpdate = output<{ original: string; modified: string }>();
}
/* eslint-enable @angular-eslint/component-selector */

function createEntries(count: number): DiffLanguageEntry[] {
  const allEntries: DiffLanguageEntry[] = [
    {
      language: 'html',
      label: 'HTML',
      monacoLanguage: 'html',
      original: '<h1>Hello</h1>',
      modified: '<h1>World</h1>',
    },
    {
      language: 'css',
      label: 'CSS',
      monacoLanguage: 'css',
      original: 'body { color: red; }',
      modified: 'body { color: blue; }',
    },
    {
      language: 'js',
      label: 'JavaScript',
      monacoLanguage: 'javascript',
      original: 'console.log("original");',
      modified: 'console.log("modified");',
    },
    {
      language: 'vtt',
      label: 'VTT',
      monacoLanguage: 'plaintext',
      original: 'WEBVTT',
      modified: 'WEBVTT modified',
    },
  ];
  return allEntries.slice(0, count);
}

describe('EditorDiffView', () => {
  async function setup(
    entries: DiffLanguageEntry[],
    onModifiedChange?: (event: { language: string; content: string }) => void,
  ) {
    return render(EditorDiffView, {
      inputs: { entries },
      on: {
        modifiedChange: onModifiedChange ?? vi.fn(),
      },
      componentImports: [MockCatbeeMonacoDiffEditor],
    });
  }

  describe('renders correct number of diff editors', () => {
    it('should render 2 diff editors for 2 entries', async () => {
      await setup(createEntries(2));
      const editors = screen.getAllByTestId('mock-diff-editor');
      expect(editors).toHaveLength(2);
    });

    it('should render 4 diff editors for 4 entries', async () => {
      await setup(createEntries(4));
      const editors = screen.getAllByTestId('mock-diff-editor');
      expect(editors).toHaveLength(4);
    });

    it('should render 1 diff editor for 1 entry', async () => {
      await setup(createEntries(1));
      const editors = screen.getAllByTestId('mock-diff-editor');
      expect(editors).toHaveLength(1);
    });
  });

  describe('modifiedChange output', () => {
    it('should emit modifiedChange with correct language and content when diff updates', async () => {
      const onModifiedChange = vi.fn();
      const entries = createEntries(2);
      const { fixture } = await setup(entries, onModifiedChange);

      // Get the component instance and trigger onDiffUpdate directly
      const component = fixture.componentInstance;
      component['onDiffUpdate']('css', {
        original: 'body { color: red; }',
        modified: 'body { color: green; }',
      });

      expect(onModifiedChange).toHaveBeenCalledWith({
        language: 'css',
        content: 'body { color: green; }',
      });
    });

    it('should emit the correct language key for html', async () => {
      const onModifiedChange = vi.fn();
      const entries = createEntries(2);
      const { fixture } = await setup(entries, onModifiedChange);

      const component = fixture.componentInstance;
      component['onDiffUpdate']('html', {
        original: '<h1>Hello</h1>',
        modified: '<h1>Updated</h1>',
      });

      expect(onModifiedChange).toHaveBeenCalledWith({
        language: 'html',
        content: '<h1>Updated</h1>',
      });
    });
  });

  describe('originalEditable is set to false (read-only left side)', () => {
    it('should set originalEditable to false on all diff editor instances', async () => {
      const { fixture } = await setup(createEntries(3));

      // Query all mock diff editor component instances
      const diffEditors = fixture.nativeElement.querySelectorAll(
        'ng-catbee-monaco-diff-editor',
      );
      expect(diffEditors).toHaveLength(3);

      // Verify originalEditable binding by checking the template sets [originalEditable]="false"
      // We verify through the component debug elements
      const debugElements = fixture.debugElement.queryAll(
        (de) => de.nativeElement.tagName === 'NG-CATBEE-MONACO-DIFF-EDITOR',
      );

      for (const de of debugElements) {
        const mockInstance = de.componentInstance as MockCatbeeMonacoDiffEditor;
        expect(mockInstance.originalEditable()).toBe(false);
      }
    });
  });

  describe('language labels', () => {
    it('should render a label heading for each entry', async () => {
      await setup(createEntries(3));

      expect(screen.getByText('HTML')).toBeTruthy();
      expect(screen.getByText('CSS')).toBeTruthy();
      expect(screen.getByText('JavaScript')).toBeTruthy();
    });
  });
});
