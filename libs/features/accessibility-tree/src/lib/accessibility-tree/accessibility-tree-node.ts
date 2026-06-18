import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  output,
  forwardRef,
} from '@angular/core';
import { AccessibilityNode } from '@practica11y/types';

export interface TreeNodeFocusEvent {
  node: AccessibilityNode;
  element: HTMLElement;
  action: 'focus' | 'expand' | 'collapse' | 'parent';
}

@Component({
  selector: 'a11y-accessibility-tree-node',
  imports: [forwardRef(() => AccessibilityTreeNode)],
  templateUrl: './accessibility-tree-node.html',
  styleUrl: './accessibility-tree.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityTreeNode {
  readonly node = input.required<AccessibilityNode>();
  readonly depth = input<number>(0);
  readonly parentSize = input<number>(1);
  readonly positionInSet = input<number>(1);
  readonly nodeAction = output<TreeNodeFocusEvent>();

  protected readonly expanded = signal<boolean>(true);

  protected readonly hasChildren = computed(
    () => this.node().children.length > 0,
  );

  protected readonly isTextNode = computed(
    () => this.node().role === 'StaticText',
  );

  protected readonly displayLabel = computed(() => {
    const n = this.node();
    let label = n.role;
    if (n.name) {
      label += ` "${n.name}"`;
    }
    if (n.level != null) {
      label += ` (Level ${n.level})`;
    }
    return label;
  });

  protected toggleExpand(event: Event): void {
    event.stopPropagation();
    if (this.hasChildren()) {
      this.expanded.update((v) => !v);
    }
  }

  protected expand(): void {
    if (this.hasChildren()) {
      this.expanded.set(true);
    }
  }

  protected collapse(): void {
    this.expanded.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const el = event.currentTarget as HTMLElement;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        if (this.hasChildren() && !this.expanded()) {
          this.expanded.set(true);
        } else if (this.hasChildren() && this.expanded()) {
          this.nodeAction.emit({
            node: this.node(),
            element: el,
            action: 'expand',
          });
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (this.hasChildren() && this.expanded()) {
          this.expanded.set(false);
        } else {
          this.nodeAction.emit({
            node: this.node(),
            element: el,
            action: 'parent',
          });
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.hasChildren()) {
          this.expanded.update((v) => !v);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.nodeAction.emit({
          node: this.node(),
          element: el,
          action: 'focus',
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.nodeAction.emit({
          node: this.node(),
          element: el,
          action: 'focus',
        });
        break;

      case 'Home':
        event.preventDefault();
        this.nodeAction.emit({
          node: this.node(),
          element: el,
          action: 'focus',
        });
        break;

      case 'End':
        event.preventDefault();
        this.nodeAction.emit({
          node: this.node(),
          element: el,
          action: 'focus',
        });
        break;
    }
  }

  protected onChildAction(event: TreeNodeFocusEvent): void {
    this.nodeAction.emit(event);
  }
}
