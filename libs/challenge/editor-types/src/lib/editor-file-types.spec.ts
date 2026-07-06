import {
  EDITOR_FILE_TYPES,
  EDITOR_FILE_TYPE_IDS,
  MONACO_LANGUAGE_MAP,
  EDITOR_FILE_LABEL_MAP,
  emptyCodeRecord,
  getFileTypeConfig,
  EditorFileType,
} from './editor-file-types';

describe('editor-file-types', () => {
  describe('EDITOR_FILE_TYPES', () => {
    it('should contain exactly 4 file types', () => {
      expect(EDITOR_FILE_TYPES).toHaveLength(4);
    });

    it('should have html as the first entry', () => {
      expect(EDITOR_FILE_TYPES[0].id).toBe('html');
    });

    it('should have unique IDs', () => {
      const ids = EDITOR_FILE_TYPES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have non-empty labels and monacoLanguage for each entry', () => {
      for (const entry of EDITOR_FILE_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
        expect(entry.monacoLanguage.length).toBeGreaterThan(0);
        expect(entry.extension.startsWith('.')).toBe(true);
        expect(typeof entry.alwaysVisible).toBe('boolean');
      }
    });

    it('should mark html and css as always visible', () => {
      const html = EDITOR_FILE_TYPES.find((t) => t.id === 'html')!;
      const css = EDITOR_FILE_TYPES.find((t) => t.id === 'css')!;
      expect(html.alwaysVisible).toBe(true);
      expect(css.alwaysVisible).toBe(true);
    });

    it('should mark js and vtt as not always visible', () => {
      const js = EDITOR_FILE_TYPES.find((t) => t.id === 'js')!;
      const vtt = EDITOR_FILE_TYPES.find((t) => t.id === 'vtt')!;
      expect(js.alwaysVisible).toBe(false);
      expect(vtt.alwaysVisible).toBe(false);
    });
  });

  describe('EDITOR_FILE_TYPE_IDS', () => {
    it('should contain all IDs from EDITOR_FILE_TYPES', () => {
      expect(EDITOR_FILE_TYPE_IDS).toEqual(EDITOR_FILE_TYPES.map((t) => t.id));
    });
  });

  describe('MONACO_LANGUAGE_MAP', () => {
    it('should map js to javascript', () => {
      expect(MONACO_LANGUAGE_MAP['js']).toBe('javascript');
    });

    it('should map html to html', () => {
      expect(MONACO_LANGUAGE_MAP['html']).toBe('html');
    });

    it('should map vtt to plaintext', () => {
      expect(MONACO_LANGUAGE_MAP['vtt']).toBe('plaintext');
    });
  });

  describe('EDITOR_FILE_LABEL_MAP', () => {
    it('should map js to JavaScript', () => {
      expect(EDITOR_FILE_LABEL_MAP['js']).toBe('JavaScript');
    });

    it('should map html to HTML', () => {
      expect(EDITOR_FILE_LABEL_MAP['html']).toBe('HTML');
    });
  });

  describe('emptyCodeRecord', () => {
    it('should return a record with all file types set to empty strings', () => {
      const record = emptyCodeRecord();
      for (const id of EDITOR_FILE_TYPE_IDS) {
        expect(record[id]).toBe('');
      }
    });

    it('should return a new object each time', () => {
      const a = emptyCodeRecord();
      const b = emptyCodeRecord();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('getFileTypeConfig', () => {
    it('should return config for a valid file type', () => {
      const config = getFileTypeConfig('css');
      expect(config.id).toBe('css');
      expect(config.label).toBe('CSS');
      expect(config.monacoLanguage).toBe('css');
      expect(config.extension).toBe('.css');
    });

    it('should throw for an unknown file type', () => {
      expect(() => getFileTypeConfig('xml' as EditorFileType)).toThrow(
        'Unknown editor file type: "xml"',
      );
    });
  });
});
