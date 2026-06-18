import { Parser } from 'htmlparser2';
import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/** Self-closing / void elements that don't need a closing tag */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Validates that the HTML source has no mismatched opening/closing tags.
 * Uses htmlparser2 for tokenization combined with a strict tag stack
 * that does NOT apply HTML5 implicit close rules.
 */
export const validHtmlSyntax: Validator = {
  id: 'valid-html-syntax',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml;

    if (!sourceHtml || sourceHtml.trim().length === 0) {
      return {
        validatorId: 'valid-html-syntax',
        passed: true,
        message: 'No HTML source to validate.',
      };
    }

    const errors = findMismatchedTags(sourceHtml);

    // Also check for broken tags like "< class=..." (missing tag name)
    const brokenTags = findBrokenTags(sourceHtml);
    const allErrors = [...errors, ...brokenTags];

    if (allErrors.length === 0) {
      return {
        validatorId: 'valid-html-syntax',
        passed: true,
        message: 'HTML syntax is valid. All tags are properly matched.',
      };
    }

    return {
      validatorId: 'valid-html-syntax',
      passed: false,
      message: `${allErrors.length} HTML syntax error(s) found.`,
      details: allErrors.join('; '),
    };
  },
};

/**
 * Uses htmlparser2 in XML-like mode (no implicit tag closing) to detect
 * mismatched opening/closing tags strictly.
 */
function findMismatchedTags(html: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];

  // Use recognizeSelfClosing + no implicit close behavior
  const parser = new Parser(
    {
      onopentagname(name) {
        if (!VOID_ELEMENTS.has(name)) {
          stack.push(name);
        }
      },
      onclosetag(name, isImplied) {
        if (VOID_ELEMENTS.has(name)) return;

        // If htmlparser2 implicitly closed a tag, that's an error
        if (isImplied) {
          errors.push(`Unclosed <${name}> tag (implicitly closed)`);
          return;
        }

        if (stack.length === 0) {
          errors.push(
            `Unexpected closing </${name}> without matching opening tag`,
          );
          return;
        }

        const expected = stack[stack.length - 1];
        if (expected !== name) {
          errors.push(`Expected </${expected}> but found </${name}>`);
          stack.pop();
        } else {
          stack.pop();
        }
      },
    },
    {
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
      recognizeSelfClosing: true,
    },
  );

  parser.write(html);
  parser.end();

  // Any remaining unclosed tags in the stack
  for (const unclosed of stack) {
    errors.push(`Unclosed <${unclosed}> tag`);
  }

  return errors;
}

/**
 * Detects broken tag patterns that htmlparser2 would skip as text,
 * like "< class=..." (missing tag name after <).
 */
function findBrokenTags(html: string): string[] {
  const errors: string[] = [];

  // Match < followed by a space or attribute char (not a valid tag start)
  // Valid tags start with < followed by a letter or /
  const brokenOpenRegex = /<(?![a-zA-Z/!])[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = brokenOpenRegex.exec(html)) !== null) {
    const snippet = match[0].substring(0, 30);
    errors.push(`Invalid tag syntax: "${snippet}" (missing tag name)`);
  }

  return errors;
}
