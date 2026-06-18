import { Injectable } from '@angular/core';
import { FocusAnalysisResult } from '@practica11y/types';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

@Injectable({ providedIn: 'root' })
export class FocusAnalysis {
  analyze(document: Document): FocusAnalysisResult {
    const focusTraps = this.identifyFocusTraps(document);
    const hiddenFocusable = this.identifyHiddenFocusable(document);
    const focusOrder = this.determineFocusOrder(document);

    return { focusTraps, hiddenFocusable, focusOrder };
  }

  private identifyFocusTraps(document: Document): string[] {
    const trapContainers = document.querySelectorAll(
      '[aria-modal="true"], [role="dialog"]',
    );
    const traps: string[] = [];

    trapContainers.forEach((container) => {
      traps.push(this.generateSelector(container as HTMLElement));
    });

    return traps;
  }

  private identifyHiddenFocusable(document: Document): string[] {
    const focusableElements = document.querySelectorAll(FOCUSABLE_SELECTOR);
    const hidden: string[] = [];

    focusableElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (this.isHidden(htmlEl)) {
        hidden.push(this.generateSelector(htmlEl));
      }
    });

    return hidden;
  }

  private determineFocusOrder(document: Document): string[] {
    const focusableElements = document.querySelectorAll(FOCUSABLE_SELECTOR);
    const elements: { selector: string; tabIndex: number; domIndex: number }[] =
      [];

    focusableElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      const tabIndex = htmlEl.tabIndex;

      if (tabIndex >= 0 && !this.isHidden(htmlEl)) {
        elements.push({
          selector: this.generateSelector(htmlEl),
          tabIndex,
          domIndex: index,
        });
      }
    });

    const positiveTabIndex = elements
      .filter((el) => el.tabIndex > 0)
      .sort((a, b) => a.tabIndex - b.tabIndex);

    const zeroTabIndex = elements.filter((el) => el.tabIndex === 0);

    return [...positiveTabIndex, ...zeroTabIndex].map((el) => el.selector);
  }

  private isHidden(el: HTMLElement): boolean {
    if (el.hasAttribute('hidden')) {
      return true;
    }

    if (el.getAttribute('aria-hidden') === 'true') {
      return true;
    }

    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    if (style) {
      if (style.display === 'none') {
        return true;
      }
      if (style.visibility === 'hidden') {
        return true;
      }
    }

    return false;
  }

  private generateSelector(el: HTMLElement): string {
    if (el.id) {
      return `#${el.id}`;
    }

    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;

    if (!parent) {
      return tag;
    }

    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(el) + 1;

    return `${tag}:nth-child(${index})`;
  }
}
