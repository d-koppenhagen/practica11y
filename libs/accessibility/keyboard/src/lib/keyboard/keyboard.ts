import { Injectable } from '@angular/core';
import { FocusableElement, KeyboardAnalysisResult } from '@practica11y/types';

const NATIVE_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

const INTERACTIVE_ROLES = [
  'button',
  'link',
  'tab',
  'menuitem',
  'option',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'combobox',
];

const NATIVE_INTERACTIVE_TAGS = ['a', 'button', 'input', 'select', 'textarea'];

@Injectable({ providedIn: 'root' })
export class KeyboardAnalysis {
  analyze(document: Document): KeyboardAnalysisResult {
    const focusableElements = this.identifyFocusableElements(document);
    const tabOrder = this.calculateTabOrder(focusableElements);
    const nonFocusableInteractive =
      this.identifyNonFocusableInteractive(document);

    return { focusableElements, tabOrder, nonFocusableInteractive };
  }

  private identifyFocusableElements(document: Document): FocusableElement[] {
    const elements = document.querySelectorAll(NATIVE_FOCUSABLE_SELECTOR);
    const results: FocusableElement[] = [];

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tabIndex = htmlEl.tabIndex;
      const selector = this.generateSelector(htmlEl);
      const role = this.getRole(htmlEl);
      const isInteractive = this.isInteractiveElement(htmlEl);

      results.push({ selector, role, tabIndex, isInteractive });
    });

    return results;
  }

  private calculateTabOrder(focusableElements: FocusableElement[]): string[] {
    const inTabOrder = focusableElements.filter((el) => el.tabIndex >= 0);

    const positiveTabIndex = inTabOrder
      .filter((el) => el.tabIndex > 0)
      .sort((a, b) => a.tabIndex - b.tabIndex);

    const zeroTabIndex = inTabOrder.filter((el) => el.tabIndex === 0);

    return [...positiveTabIndex, ...zeroTabIndex].map((el) => el.selector);
  }

  private identifyNonFocusableInteractive(document: Document): string[] {
    const focusableSet = new Set<Element>();
    document
      .querySelectorAll(NATIVE_FOCUSABLE_SELECTOR)
      .forEach((el) => focusableSet.add(el));

    const nonFocusable: string[] = [];

    const roleSelector = INTERACTIVE_ROLES.map(
      (role) => `[role="${role}"]`,
    ).join(',');
    const candidates = document.querySelectorAll(roleSelector);

    candidates.forEach((el) => {
      if (!focusableSet.has(el)) {
        nonFocusable.push(this.generateSelector(el as HTMLElement));
      }
    });

    return nonFocusable;
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

  private getRole(el: HTMLElement): string {
    const explicitRole = el.getAttribute('role');
    if (explicitRole) {
      return explicitRole;
    }

    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case 'a':
        return el.hasAttribute('href') ? 'link' : '';
      case 'button':
        return 'button';
      case 'input':
        return this.getInputRole(el as HTMLInputElement);
      case 'select':
        return 'combobox';
      case 'textarea':
        return 'textbox';
      default:
        return '';
    }
  }

  private getInputRole(el: HTMLInputElement): string {
    const type = el.type?.toLowerCase() ?? 'text';
    switch (type) {
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'radio';
      case 'range':
        return 'slider';
      case 'button':
      case 'submit':
      case 'reset':
        return 'button';
      default:
        return 'textbox';
    }
  }

  private isInteractiveElement(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    if (NATIVE_INTERACTIVE_TAGS.includes(tag)) {
      return true;
    }

    const role = el.getAttribute('role');
    return role != null && INTERACTIVE_ROLES.includes(role);
  }
}
