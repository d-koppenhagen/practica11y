/**
 * Central configuration for supported editor file types.
 *
 * When adding a new file type (e.g., 'svg'), extend this file only.
 * All consumers derive their types, labels, and language mappings from here.
 */

/**
 * Union type of all supported editor file type identifiers.
 */
export type EditorFileType = 'html' | 'css' | 'js' | 'vtt';

/**
 * Metadata describing a single supported editor file type.
 */
export interface EditorFileTypeConfig {
  /** Short identifier used internally and in frontmatter (e.g., 'js') */
  id: EditorFileType;
  /** Human-readable label shown in the UI (e.g., 'JavaScript') */
  label: string;
  /** Monaco Editor language ID for syntax highlighting */
  monacoLanguage: string;
  /** File extension including the dot (e.g., '.js') */
  extension: string;
  /** Whether this file type tab is always visible regardless of starter content */
  alwaysVisible: boolean;
}

/**
 * Complete registry of all supported editor file types.
 * Order determines default tab ordering in the UI.
 */
export const EDITOR_FILE_TYPES: readonly EditorFileTypeConfig[] = [
  {
    id: 'html',
    label: 'HTML',
    monacoLanguage: 'html',
    extension: '.html',
    alwaysVisible: true,
  },
  {
    id: 'css',
    label: 'CSS',
    monacoLanguage: 'css',
    extension: '.css',
    alwaysVisible: true,
  },
  {
    id: 'js',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    extension: '.js',
    alwaysVisible: false,
  },
  {
    id: 'vtt',
    label: 'VTT',
    monacoLanguage: 'plaintext',
    extension: '.vtt',
    alwaysVisible: false,
  },
] as const;

/**
 * All supported file type IDs as a readonly array.
 * Useful for iteration and validation.
 */
export const EDITOR_FILE_TYPE_IDS: readonly EditorFileType[] =
  EDITOR_FILE_TYPES.map((t) => t.id);

/**
 * Lookup map from file type ID to its Monaco language ID.
 */
export const MONACO_LANGUAGE_MAP: Readonly<Record<EditorFileType, string>> =
  Object.fromEntries(
    EDITOR_FILE_TYPES.map((t) => [t.id, t.monacoLanguage]),
  ) as Record<EditorFileType, string>;

/**
 * Lookup map from file type ID to its human-readable label.
 */
export const EDITOR_FILE_LABEL_MAP: Readonly<Record<EditorFileType, string>> =
  Object.fromEntries(EDITOR_FILE_TYPES.map((t) => [t.id, t.label])) as Record<
    EditorFileType,
    string
  >;

/**
 * Returns an empty code record with all file types initialized to empty strings.
 * Used as default for StarterCode-like structures.
 */
export function emptyCodeRecord(): Record<EditorFileType, string> {
  return Object.fromEntries(EDITOR_FILE_TYPES.map((t) => [t.id, ''])) as Record<
    EditorFileType,
    string
  >;
}

/**
 * Returns the EditorFileTypeConfig for a given file type ID.
 * Throws if the ID is not recognized.
 */
export function getFileTypeConfig(id: EditorFileType): EditorFileTypeConfig {
  const config = EDITOR_FILE_TYPES.find((t) => t.id === id);
  if (!config) {
    throw new Error(`Unknown editor file type: "${id}"`);
  }
  return config;
}
