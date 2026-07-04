import type { Validator, ValidationResult } from '@practica11y/models';
import type { AccessibilityAnalysisResult } from '@practica11y/types';

/**
 * Valid BCP 47 primary language subtag pattern (ISO 639-1/639-2).
 */
const VALID_LANG_PATTERN = /^[a-z]{2,3}(-[a-zA-Z0-9]+)*$/;

/**
 * Known language indicators — maps language codes to character/word patterns
 * commonly found in that language. Used to detect mismatched lang attributes.
 */
const LANGUAGE_INDICATORS: Record<string, RegExp> = {
  fr: /[àâæçéèêëïîôœùûüÿ]|(?:\b(?:le|la|les|un|une|des|est|et|qui|que|dans|pour|avec|sur|pas|nous|vous|ils|sont)\b)/i,
  es: /[áéíóúñ¿¡]|(?:\b(?:el|la|los|las|un|una|es|que|en|por|con|para|como|pero|del|son|más)\b)/i,
  de: /[äöüß]|(?:\b(?:der|die|das|ein|eine|ist|und|auf|für|mit|nicht|sich|auch|noch|nach)\b)/i,
  it: /[àèéìíîòóùú]|(?:\b(?:il|lo|la|gli|le|un|una|che|è|di|per|con|sono|anche|questo|quella)\b)/i,
  pt: /[ãõàáâéêíóôú]|(?:\b(?:o|a|os|as|um|uma|que|não|para|com|mais|isso|esta|este)\b)/i,
};

/**
 * Validates that:
 * 1. The <html> element has a valid `lang` attribute (WCAG 3.1.1 Language of Page)
 * 2. Inline content in other languages uses correct `lang` attributes (WCAG 3.1.2 Language of Parts)
 *
 * NOTE: This validator works on sourceHtml (raw editor content) because the sandbox
 * wraps user HTML in its own <html lang="en"> element, making the live DOM unreliable
 * for checking the user's <html> lang attribute.
 */
export const documentLanguage: Validator = {
  id: 'document-language',

  validate(_document: Document, context?: unknown): ValidationResult {
    const analysisResult = context as AccessibilityAnalysisResult | undefined;
    const sourceHtml = analysisResult?.sourceHtml ?? '';
    const errors: string[] = [];

    if (!sourceHtml.trim()) {
      return {
        validatorId: 'document-language',
        passed: true,
        message: 'No HTML source to validate.',
      };
    }

    // Parse the source HTML to inspect the user's actual markup
    const parser = new DOMParser();
    const doc = parser.parseFromString(sourceHtml, 'text/html');

    // --- Check 1: <html> element must have a valid lang attribute ---
    const htmlElement = doc.documentElement;
    const htmlLang = htmlElement?.getAttribute('lang')?.trim();

    if (!htmlLang) {
      errors.push(
        'The <html> element is missing a `lang` attribute. Add lang="en" (or the appropriate language code) to declare the document language.',
      );
    } else if (!VALID_LANG_PATTERN.test(htmlLang)) {
      errors.push(
        `The <html> element has an invalid lang value "${htmlLang}". Use a valid BCP 47 language tag (e.g. "en", "fr", "es").`,
      );
    }

    // --- Check 2: Check blockquotes/q elements for lang attributes ---
    const blockquotes = doc.querySelectorAll('blockquote, q');
    const blockquotesWithLang = doc.querySelectorAll(
      'blockquote[lang], q[lang]',
    );

    if (blockquotes.length > 0 && blockquotesWithLang.length === 0) {
      errors.push(
        'Quotation elements (<blockquote> or <q>) are present but none have a `lang` attribute. If the quoted text is in a different language than the document, mark it with the appropriate `lang` attribute.',
      );
    } else if (
      blockquotes.length > 0 &&
      blockquotesWithLang.length < blockquotes.length
    ) {
      const missing = blockquotes.length - blockquotesWithLang.length;
      errors.push(
        `${missing} quotation element(s) are missing a \`lang\` attribute. Mark foreign-language quotes with their respective language code.`,
      );
    }

    // --- Check 3: Verify lang attributes match the actual content language ---
    for (const el of Array.from(blockquotesWithLang)) {
      const lang = el.getAttribute('lang')?.trim().toLowerCase();
      const textContent = el.textContent?.trim() ?? '';

      if (!lang || !textContent) continue;

      // Check if the declared language matches the content
      const primaryLang = lang.split('-')[0];
      for (const [expectedLang, pattern] of Object.entries(
        LANGUAGE_INDICATORS,
      )) {
        if (expectedLang === primaryLang) continue;

        // If content strongly matches another language but not the declared one
        const matchesOther = pattern.test(textContent);
        const declaredPattern = LANGUAGE_INDICATORS[primaryLang];
        const matchesDeclared = declaredPattern
          ? declaredPattern.test(textContent)
          : false;

        if (matchesOther && !matchesDeclared) {
          const tagName = el.tagName.toLowerCase();
          errors.push(
            `A <${tagName}> element has lang="${lang}" but the content appears to be in "${expectedLang}". Verify the language code matches the actual text language.`,
          );
          break;
        }
      }
    }

    // --- Check 4: Validate that any lang values on descendants are valid ---
    const elementsWithLang = doc.querySelectorAll('[lang]:not(html)');
    for (const el of Array.from(elementsWithLang)) {
      const lang = el.getAttribute('lang')?.trim() ?? '';
      if (lang && !VALID_LANG_PATTERN.test(lang)) {
        errors.push(
          `An element has an invalid lang value "${lang}". Use a valid BCP 47 language tag.`,
        );
      }
    }

    const passed = errors.length === 0;
    return {
      validatorId: 'document-language',
      passed,
      message: passed
        ? 'Document language is correctly declared and inline language changes are properly marked.'
        : `Document language has ${errors.length} issue(s).`,
      details: passed ? undefined : errors.join('\n'),
    };
  },
};
