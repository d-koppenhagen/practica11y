import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that an infinite-scroll page provides accessible bypass mechanisms:
 * 1. A skip link that allows users to jump past the feed region
 * 2. A footer landmark so screen reader users can navigate to it
 * 3. A "Load more" button instead of automatic infinite scroll
 * 4. A feed section with an accessible name (aria-label or aria-labelledby)
 */
export const infiniteScrollBypass: Validator = {
  id: 'infinite-scroll-bypass',

  validate(document: Document): ValidationResult {
    const issues: string[] = [];

    // 1. Check for a skip link that targets content after the feed
    const skipLink = findSkipLink(document);
    if (!skipLink) {
      issues.push(
        'No skip link found that allows users to bypass the feed. Add a link (e.g. <a href="#site-footer">) before the feed region.',
      );
    }

    // 2. Check for a footer landmark
    const footer = document.querySelector('footer, [role="contentinfo"]');
    if (!footer) {
      issues.push(
        'No <footer> landmark found. Wrap the footer content in a <footer> element so screen reader users can navigate to it via landmarks.',
      );
    }

    // 3. Check for a "Load more" button (user-controlled loading)
    const loadMoreBtn = findLoadMoreButton(document);
    if (!loadMoreBtn) {
      issues.push(
        'No "Load more" button found. Replace automatic infinite scroll with a button that gives users control over content loading.',
      );
    }

    // 4. Check for a feed section with an accessible name
    const feedSection = findAccessibleFeedSection(document);
    if (!feedSection) {
      issues.push(
        'No accessible feed section found. Wrap the feed in a <section> with an aria-label or use role="feed" so screen reader users can identify and skip it.',
      );
    }

    const passed = issues.length === 0;

    return {
      validatorId: 'infinite-scroll-bypass',
      passed,
      message: passed
        ? 'Infinite scroll bypass mechanisms correctly implemented.'
        : `${issues.length} issue(s) found with the infinite scroll accessibility.`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};

/**
 * Finds a skip link that targets content after the feed (e.g., footer).
 */
function findSkipLink(document: Document): Element | null {
  const links = Array.from(document.querySelectorAll('a[href^="#"]'));

  return (
    links.find((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return false;

      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return false;

      // Check that the target is after the feed (footer, or a section after the feed)
      const isFooter =
        target.tagName === 'FOOTER' ||
        target.getAttribute('role') === 'contentinfo';
      const isInsideFooter = target.closest('footer') !== null;
      const isAfterFeed =
        target.closest('[role="feed"]') === null &&
        target.closest('#feed') === null;

      // The link text should indicate it skips something
      const linkText = (link.textContent || '').toLowerCase();
      const isSkipText =
        linkText.includes('skip') ||
        linkText.includes('jump') ||
        linkText.includes('go to');

      return (isFooter || isInsideFooter || isAfterFeed) && isSkipText;
    }) ?? null
  );
}

/**
 * Finds a button that loads more content (not automatic scroll-triggered loading).
 */
function findLoadMoreButton(document: Document): Element | null {
  const buttons = Array.from(document.querySelectorAll('button'));

  return (
    buttons.find((button) => {
      const text = (button.textContent || '').toLowerCase();
      return (
        text.includes('load more') ||
        text.includes('show more') ||
        text.includes('more articles') ||
        text.includes('load next')
      );
    }) ?? null
  );
}

/**
 * Finds a section or element with role="feed" that has an accessible name.
 */
function findAccessibleFeedSection(document: Document): Element | null {
  // Check for role="feed"
  const feedRole = document.querySelector('[role="feed"]');
  if (feedRole) return feedRole;

  // Check for a section with aria-label that wraps the feed
  const sections = Array.from(
    document.querySelectorAll('section[aria-label], section[aria-labelledby]'),
  );

  return (
    sections.find((section) => {
      const label = (section.getAttribute('aria-label') || '').toLowerCase();
      const labelledBy = section.getAttribute('aria-labelledby');

      if (label.includes('feed') || label.includes('article')) {
        return true;
      }

      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        const labelText = (labelEl?.textContent || '').toLowerCase();
        return labelText.includes('feed') || labelText.includes('article');
      }

      return false;
    }) ?? null
  );
}
