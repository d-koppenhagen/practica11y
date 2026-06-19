import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Canonical production origin used to build absolute URLs. */
const SITE_ORIGIN = 'https://practica11y.dev';
const SITE_NAME = 'Practica11y';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/assets/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Practica11y is a free, gamified learning platform for web accessibility. ' +
  'Solve interactive, browser-based challenges to master WCAG 2.2 and build inclusive websites.';

export interface SeoConfig {
  /** Page title without the site-name suffix. */
  title: string;
  /** Meta description for the page. */
  description?: string;
  /** Route path (e.g. "/about" or "/challenges/foo"). Defaults to "/". */
  path?: string;
  /** Absolute or root-relative image URL. Defaults to the global OG image. */
  image?: string;
}

/**
 * Seo keeps the document title and social-sharing meta tags
 * (Open Graph + Twitter/X cards) in sync with the active route.
 *
 * Note: most social crawlers (LinkedIn, Bluesky, Facebook) do not execute
 * JavaScript, so the static tags in `index.html` cover the initial load.
 * This service improves the experience for in-app navigation and for
 * crawlers that do run JavaScript (e.g. Googlebot).
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** Update title, description, canonical URL and social meta tags. */
  update(config: SeoConfig): void {
    const description = config.description ?? DEFAULT_DESCRIPTION;
    const path = config.path ?? '/';
    const url = this.toAbsoluteUrl(path);
    const image = this.toAbsoluteUrl(config.image ?? DEFAULT_IMAGE);
    const fullTitle =
      config.title === SITE_NAME
        ? config.title
        : `${config.title} — ${SITE_NAME}`;

    this.title.setTitle(fullTitle);

    this.setName('description', description);

    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', image);

    this.setName('twitter:title', fullTitle);
    this.setName('twitter:description', description);
    this.setName('twitter:image', image);

    this.setCanonical(url);
  }

  private toAbsoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) {
      return pathOrUrl;
    }
    return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
