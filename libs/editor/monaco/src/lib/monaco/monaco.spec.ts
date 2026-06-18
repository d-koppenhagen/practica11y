import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Monaco } from './monaco';

// Mock types
type ContentChangeCallback = () => void;

// Mock matchMedia for ThemeService which is injected transitively
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Monaco', () => {
  let component: Monaco;
  let fixture: ComponentFixture<Monaco>;
  let contentChangeCallback: ContentChangeCallback | null;
  let mockEditor: {
    getValue: ReturnType<typeof vi.fn>;
    setValue: ReturnType<typeof vi.fn>;
    getModel: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    onDidChangeModelContent: ReturnType<typeof vi.fn>;
  };
  let mockMonacoNamespace: {
    editor: {
      create: ReturnType<typeof vi.fn>;
      setModelLanguage: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    contentChangeCallback = null;

    mockEditor = {
      getValue: vi.fn().mockReturnValue(''),
      setValue: vi.fn(),
      getModel: vi.fn().mockReturnValue({}),
      dispose: vi.fn(),
      onDidChangeModelContent: vi.fn((cb: ContentChangeCallback) => {
        contentChangeCallback = cb;
      }),
    };

    mockMonacoNamespace = {
      editor: {
        create: vi.fn().mockReturnValue(mockEditor),
        setModelLanguage: vi.fn(),
      },
    };

    await TestBed.configureTestingModule({
      imports: [Monaco],
    }).compileComponents();

    fixture = TestBed.createComponent(Monaco);
    component = fixture.componentInstance;
  });

  /**
   * Simulates the editor initialization that normally happens in afterNextRender.
   * We directly set the monaco reference and call createEditor with our mock,
   * bypassing the dynamic import which doesn't work in bundled test environments.
   */
  function initializeEditor(): void {
    fixture.detectChanges();
    // Set the monaco namespace reference (normally set in loadMonacoEditor)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).monaco = mockMonacoNamespace;
    // Directly invoke createEditor with the mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).createEditor(mockMonacoNamespace);
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display initial content in the editor', () => {
    fixture.componentRef.setInput('initialContent', '<h1>Hello</h1>');
    initializeEditor();

    expect(mockMonacoNamespace.editor.create).toHaveBeenCalled();
    const createOptions = mockMonacoNamespace.editor.create.mock.calls[0][1];
    expect(createOptions.value).toBe('<h1>Hello</h1>');
  });

  it('should emit content changes via the output signal', () => {
    initializeEditor();

    const emittedValues: string[] = [];
    component.content.subscribe((value: string) => {
      emittedValues.push(value);
    });

    // Simulate a content change in the mock editor
    mockEditor.getValue.mockReturnValue('<p>New content</p>');
    expect(contentChangeCallback).not.toBeNull();
    contentChangeCallback!();

    expect(emittedValues).toContain('<p>New content</p>');
  });

  it('should update editor language when language input changes', async () => {
    fixture.componentRef.setInput('language', 'html');
    initializeEditor();

    expect(mockMonacoNamespace.editor.create).toHaveBeenCalled();
    const createOptions = mockMonacoNamespace.editor.create.mock.calls[0][1];
    expect(createOptions.language).toBe('html');

    // Change language input to trigger the effect
    fixture.componentRef.setInput('language', 'css');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockMonacoNamespace.editor.setModelLanguage).toHaveBeenCalledWith(
      {},
      'css',
    );
  });

  it('should update editor content when initialContent input changes', async () => {
    fixture.componentRef.setInput('initialContent', 'initial');
    initializeEditor();

    // Now change initialContent — the effect should call setValue
    mockEditor.getValue.mockReturnValue('initial');
    fixture.componentRef.setInput('initialContent', 'updated content');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockEditor.setValue).toHaveBeenCalledWith('updated content');
  });

  it('should dispose editor on component destroy', () => {
    initializeEditor();

    fixture.destroy();

    expect(mockEditor.dispose).toHaveBeenCalled();
  });
});
