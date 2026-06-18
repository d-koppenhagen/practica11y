import {
  Component,
  ChangeDetectionStrategy,
  input,
  ElementRef,
  inject,
} from '@angular/core';
import { AccessibilityNode } from '@practica11y/types';
import {
  AccessibilityTreeNode,
  TreeNodeFocusEvent,
} from './accessibility-tree-node';

@Component({
  selector: 'a11y-accessibility-tree',
  imports: [AccessibilityTreeNode],
  templateUrl: './accessibility-tree.html',
  styleUrl: './accessibility-tree.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityTree {
  readonly tree = input<AccessibilityNode | null>(null);
  readonly pageTitle = input<string | null>(null);

  private readonly elementRef = inject(ElementRef);

  protected onTreeKeydown(event: KeyboardEvent): void {
    const treeItems = this.getVisibleTreeItems();
    if (treeItems.length === 0) return;

    const currentIndex = treeItems.findIndex(
      (item) => item === document.activeElement,
    );

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex =
          currentIndex < treeItems.length - 1 ? currentIndex + 1 : currentIndex;
        treeItems[nextIndex]?.focus();
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        treeItems[prevIndex]?.focus();
        break;
      }

      case 'Home': {
        event.preventDefault();
        treeItems[0]?.focus();
        break;
      }

      case 'End': {
        event.preventDefault();
        treeItems[treeItems.length - 1]?.focus();
        break;
      }
    }
  }

  protected onNodeAction(event: TreeNodeFocusEvent): void {
    switch (event.action) {
      case 'expand': {
        // Move focus to first child after expansion
        // Use setTimeout to allow DOM to update after expansion
        setTimeout(() => {
          const updatedItems = this.getVisibleTreeItems();
          const newIndex = updatedItems.findIndex(
            (item) => item === event.element,
          );
          if (newIndex >= 0 && newIndex + 1 < updatedItems.length) {
            updatedItems[newIndex + 1]?.focus();
          }
        });
        break;
      }

      case 'parent': {
        // Move to parent treeitem
        const parentLi = event.element.parentElement?.closest(
          'li[role="treeitem"]',
        ) as HTMLElement | null;
        if (parentLi) {
          parentLi.focus();
        }
        break;
      }

      case 'focus': {
        // Already handled at tree level via onTreeKeydown
        break;
      }
    }
  }

  private getVisibleTreeItems(): HTMLElement[] {
    const root = this.elementRef.nativeElement as HTMLElement;
    return Array.from(
      root.querySelectorAll('li[role="treeitem"]'),
    ) as HTMLElement[];
  }
}
