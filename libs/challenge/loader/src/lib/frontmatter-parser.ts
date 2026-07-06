import { parse as parseYaml } from 'yaml';
import type { ChallengeMeta } from '@practica11y/models';
import {
  EDITOR_FILE_TYPES,
  type EditorFileType,
} from '@practica11y/editor-types';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

const VALID_DIFFICULTIES: ChallengeMeta['difficulty'][] = [
  'beginner',
  'intermediate',
  'advanced',
];

/**
 * Extracts and validates YAML frontmatter from a raw markdown string.
 * Returns a typed ChallengeMeta object.
 *
 * @throws Error with descriptive message if frontmatter is missing or invalid
 */
export function parseFrontmatter(raw: string): ChallengeMeta {
  if (!raw || raw.trim() === '') {
    throw new Error(
      'Invalid frontmatter: Input is empty. Expected a markdown string with YAML frontmatter between --- delimiters.',
    );
  }

  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error(
      'Invalid frontmatter: No valid frontmatter block found. Expected YAML content between opening and closing --- delimiters.',
    );
  }

  const yamlContent = match[1];
  let parsed: unknown;

  try {
    parsed = parseYaml(yamlContent);
  } catch (e) {
    throw new Error(
      `Invalid frontmatter: Failed to parse YAML. ${e instanceof Error ? e.message : String(e)}`,
      { cause: e },
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      'Invalid frontmatter: Parsed content is not a valid object.',
    );
  }

  return validateChallengeMeta(parsed as Record<string, unknown>);
}

/**
 * Extracts the markdown body content after the closing --- delimiter.
 * Returns the trimmed body content.
 */
export function parseMarkdownBody(raw: string): string {
  if (!raw || raw.trim() === '') {
    return '';
  }

  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    // No frontmatter found — entire content is body
    return raw.trim();
  }

  // Body starts after the full frontmatter match
  const body = raw.slice(match[0].length);
  return body.trim();
}

function validateChallengeMeta(data: Record<string, unknown>): ChallengeMeta {
  // Required string fields
  validateRequiredString(data, 'id');
  validateRequiredString(data, 'title');

  // Difficulty
  if (
    !('difficulty' in data) ||
    data['difficulty'] === undefined ||
    data['difficulty'] === null
  ) {
    throw new Error('Missing required field: difficulty');
  }
  if (
    !VALID_DIFFICULTIES.includes(
      data['difficulty'] as ChallengeMeta['difficulty'],
    )
  ) {
    throw new Error(
      `Invalid field "difficulty": Must be one of "beginner", "intermediate", "advanced". Got "${String(data['difficulty'])}".`,
    );
  }

  // Tags
  if (
    !('tags' in data) ||
    data['tags'] === undefined ||
    data['tags'] === null
  ) {
    throw new Error('Missing required field: tags');
  }
  if (!Array.isArray(data['tags'])) {
    throw new Error('Invalid field "tags": Must be an array of strings.');
  }
  if (!data['tags'].every((t: unknown) => typeof t === 'string')) {
    throw new Error('Invalid field "tags": All items must be strings.');
  }

  // Points
  if (
    !('points' in data) ||
    data['points'] === undefined ||
    data['points'] === null
  ) {
    throw new Error('Missing required field: points');
  }
  if (typeof data['points'] !== 'number' || !Number.isFinite(data['points'])) {
    throw new Error(
      `Invalid field "points": Must be a number. Got "${String(data['points'])}".`,
    );
  }

  // Starter
  if (
    !('starter' in data) ||
    data['starter'] === undefined ||
    data['starter'] === null
  ) {
    throw new Error('Missing required field: starter');
  }
  if (typeof data['starter'] !== 'object' || Array.isArray(data['starter'])) {
    throw new Error(
      'Invalid field "starter": Must be an object with at least an "html" property.',
    );
  }
  const starter = data['starter'] as Record<string, unknown>;
  if (
    !('html' in starter) ||
    typeof starter['html'] !== 'string' ||
    starter['html'].trim() === ''
  ) {
    throw new Error(
      'Invalid field "starter.html": Must be a non-empty string (file path).',
    );
  }
  // Validate optional starter file types
  for (const fileType of EDITOR_FILE_TYPES) {
    if (fileType.id === 'html') continue; // already validated as required
    if (
      fileType.id in starter &&
      starter[fileType.id] !== undefined &&
      starter[fileType.id] !== null &&
      typeof starter[fileType.id] !== 'string'
    ) {
      throw new Error(
        `Invalid field "starter.${fileType.id}": Must be a string (file path) if provided.`,
      );
    }
  }

  // Validators
  if (
    !('validators' in data) ||
    data['validators'] === undefined ||
    data['validators'] === null
  ) {
    throw new Error('Missing required field: validators');
  }
  if (!Array.isArray(data['validators'])) {
    throw new Error('Invalid field "validators": Must be an array of strings.');
  }
  if (!data['validators'].every((v: unknown) => typeof v === 'string')) {
    throw new Error('Invalid field "validators": All items must be strings.');
  }

  // Solution (optional)
  if (
    'solution' in data &&
    data['solution'] !== undefined &&
    data['solution'] !== null
  ) {
    if (
      typeof data['solution'] !== 'object' ||
      Array.isArray(data['solution'])
    ) {
      throw new Error(
        'Invalid field "solution": Must be an object mapping file types to paths.',
      );
    }
    const solution = data['solution'] as Record<string, unknown>;
    for (const fileType of EDITOR_FILE_TYPES) {
      if (
        fileType.id in solution &&
        solution[fileType.id] !== undefined &&
        solution[fileType.id] !== null &&
        typeof solution[fileType.id] !== 'string'
      ) {
        throw new Error(
          `Invalid field "solution.${fileType.id}": Must be a string (file path) if provided.`,
        );
      }
    }
  }

  // discussionUrl (optional)
  if (
    'discussionUrl' in data &&
    data['discussionUrl'] !== undefined &&
    data['discussionUrl'] !== null &&
    data['discussionUrl'] !== ''
  ) {
    if (typeof data['discussionUrl'] !== 'string') {
      throw new Error('Invalid field "discussionUrl": Must be a string.');
    }
    try {
      new URL(data['discussionUrl'] as string);
    } catch {
      throw new Error(
        'Invalid field "discussionUrl": Must be a well-formed URL.',
      );
    }
  }

  // Build solution object if present
  let solutionResult: ChallengeMeta['solution'] | undefined;
  if (
    'solution' in data &&
    data['solution'] !== undefined &&
    data['solution'] !== null
  ) {
    const solution = data['solution'] as Record<string, unknown>;
    solutionResult = Object.fromEntries(
      EDITOR_FILE_TYPES.filter((t) => typeof solution[t.id] === 'string').map(
        (t) => [t.id, solution[t.id] as string],
      ),
    ) as Partial<Record<EditorFileType, string>>;
  }

  return {
    id: data['id'] as string,
    title: data['title'] as string,
    difficulty: data['difficulty'] as ChallengeMeta['difficulty'],
    tags: data['tags'] as string[],
    points: data['points'] as number,
    starter: {
      html: starter['html'] as string,
      ...Object.fromEntries(
        EDITOR_FILE_TYPES.filter((t) => t.id !== 'html' && starter[t.id]).map(
          (t) => [t.id, starter[t.id] as string],
        ),
      ),
    },
    validators: data['validators'] as string[],
    ...(typeof data['previewTitle'] === 'string' &&
    data['previewTitle'].trim() !== ''
      ? { previewTitle: data['previewTitle'] as string }
      : {}),
    ...(Array.isArray(data['links']) && data['links'].length > 0
      ? { links: validateLinks(data['links']) }
      : {}),
    ...(typeof data['discussionUrl'] === 'string' &&
    data['discussionUrl'].trim() !== ''
      ? { discussionUrl: data['discussionUrl'] as string }
      : {}),
    ...(solutionResult ? { solution: solutionResult } : {}),
  };
}

function validateLinks(links: unknown[]): { text: string; url: string }[] {
  return links.map((link, index) => {
    if (!link || typeof link !== 'object') {
      throw new Error(
        `Invalid field "links[${index}]": Each link must be an object with "text" and "url".`,
      );
    }
    const l = link as Record<string, unknown>;
    if (typeof l['text'] !== 'string' || l['text'].trim() === '') {
      throw new Error(
        `Invalid field "links[${index}].text": Must be a non-empty string.`,
      );
    }
    if (typeof l['url'] !== 'string' || l['url'].trim() === '') {
      throw new Error(
        `Invalid field "links[${index}].url": Must be a non-empty string.`,
      );
    }
    return { text: l['text'] as string, url: l['url'] as string };
  });
}

function validateRequiredString(
  data: Record<string, unknown>,
  field: string,
): void {
  if (!(field in data) || data[field] === undefined || data[field] === null) {
    throw new Error(`Missing required field: ${field}`);
  }
  if (typeof data[field] !== 'string') {
    throw new Error(
      `Invalid field "${field}": Must be a string. Got "${typeof data[field]}".`,
    );
  }
  if ((data[field] as string).trim() === '') {
    throw new Error(`Invalid field "${field}": Must not be empty.`);
  }
}
