import { Injectable } from '@angular/core';
import { getRole, computeAccessibleName } from 'dom-accessibility-api';
import {
  AccessibilityNode,
  AccessibilityNodeProperty,
} from '@practica11y/types';

const HEADING_REGEX = /^h([1-6])$/i;

const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

@Injectable({ providedIn: 'root' })
export class TreeGenerator {
  generate(rootElement: Element): AccessibilityNode {
    const role = getRole(rootElement) ?? 'generic';
    const name = computeAccessibleName(rootElement) || undefined;
    const level = this.getHeadingLevel(rootElement);
    const properties = this.getProperties(rootElement);

    const children: AccessibilityNode[] = [];

    for (const child of Array.from(rootElement.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        // Skip elements that have no accessible output
        if (tag === 'script' || tag === 'style' || tag === 'noscript') {
          continue;
        }
        const node = this.generate(el);
        if (node.role !== 'none' && node.role !== 'presentation') {
          children.push(node);
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push({ role: 'StaticText', name: text, children: [] });
        }
      }
    }

    const node: AccessibilityNode = {
      role,
      children,
    };

    if (name) {
      node.name = name;
    }

    if (level !== undefined) {
      node.level = level;
    }

    if (properties.length > 0) {
      node.properties = properties;
    }

    return node;
  }

  private getHeadingLevel(element: Element): number | undefined {
    const match = element.tagName.match(HEADING_REGEX);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private getProperties(element: Element): AccessibilityNodeProperty[] {
    const props: AccessibilityNodeProperty[] = [];
    const el = element as HTMLInputElement;

    // focusable
    if (element.matches(FOCUSABLE_SELECTOR)) {
      props.push({ key: 'focusable', value: true });
    }

    // settable (editable inputs, textareas, contenteditables)
    if (
      element.matches(
        'input:not([type="hidden"]):not([readonly]), textarea, [contenteditable="true"]',
      )
    ) {
      props.push({ key: 'settable', value: true });
    }

    // required
    if (
      el.required === true ||
      element.getAttribute('aria-required') === 'true'
    ) {
      props.push({ key: 'required', value: true });
    } else if (element.matches('input, select, textarea')) {
      props.push({ key: 'required', value: false });
    }

    // disabled
    if (
      el.disabled === true ||
      element.getAttribute('aria-disabled') === 'true'
    ) {
      props.push({ key: 'disabled', value: true });
    }

    // readonly
    if (
      el.readOnly === true ||
      element.getAttribute('aria-readonly') === 'true'
    ) {
      props.push({ key: 'readonly', value: true });
    }

    // checked (for checkboxes/radios)
    const ariaChecked = element.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      props.push({ key: 'checked', value: ariaChecked === 'true' });
    } else if (element.matches('input[type="checkbox"], input[type="radio"]')) {
      props.push({ key: 'checked', value: el.checked ?? false });
    }

    // expanded
    const expanded = element.getAttribute('aria-expanded');
    if (expanded !== null) {
      props.push({ key: 'expanded', value: expanded === 'true' });
    }

    // selected
    const ariaSelected = element.getAttribute('aria-selected');
    if (ariaSelected !== null) {
      props.push({ key: 'selected', value: ariaSelected === 'true' });
    }

    // invalid
    if (element.getAttribute('aria-invalid') === 'true') {
      props.push({ key: 'invalid', value: true });
    }

    // valuemin / valuemax / valuenow (range inputs, sliders, spinbuttons)
    if (
      element.matches(
        'input[type="number"], input[type="range"], [role="slider"], [role="spinbutton"]',
      )
    ) {
      const min =
        element.getAttribute('min') ??
        element.getAttribute('aria-valuemin') ??
        '0';
      const max =
        element.getAttribute('max') ??
        element.getAttribute('aria-valuemax') ??
        '0';
      props.push({ key: 'valuemin', value: min });
      props.push({ key: 'valuemax', value: max });

      const now = element.getAttribute('aria-valuenow') ?? (el.value || '');
      if (now) {
        props.push({ key: 'valuenow', value: now });
      }

      const valuetext = element.getAttribute('aria-valuetext') ?? '';
      props.push({ key: 'valuetext', value: valuetext });
    }

    // multiline (textarea)
    if (
      element.matches('textarea') ||
      element.getAttribute('aria-multiline') === 'true'
    ) {
      props.push({ key: 'multiline', value: true });
    }

    // autocomplete
    const autocomplete =
      element.getAttribute('autocomplete') ??
      element.getAttribute('aria-autocomplete');
    if (autocomplete && autocomplete !== 'off') {
      props.push({ key: 'autocomplete', value: autocomplete });
    }

    // atomic
    const atomic = element.getAttribute('aria-atomic');
    if (atomic !== null) {
      props.push({ key: 'atomic', value: atomic === 'true' });
    }

    // live
    const live = element.getAttribute('aria-live');
    if (live && live !== 'off') {
      props.push({ key: 'live', value: live });
    }

    return props;
  }
}
