import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { AccessibilityNode } from '@practica11y/types';
import { AccessibilityTree } from './accessibility-tree';

function createTestTree(): AccessibilityNode {
  return {
    role: 'document',
    name: 'Test Page',
    children: [
      {
        role: 'banner',
        name: 'Header',
        children: [
          {
            role: 'heading',
            name: 'Welcome',
            level: 1,
            children: [],
          },
          {
            role: 'navigation',
            name: 'Main Nav',
            children: [
              { role: 'link', name: 'Home', children: [] },
              { role: 'link', name: 'About', children: [] },
            ],
          },
        ],
      },
      {
        role: 'main',
        name: 'Content',
        children: [
          {
            role: 'heading',
            name: 'Article Title',
            level: 2,
            children: [],
          },
          { role: 'paragraph', name: '', children: [] },
        ],
      },
    ],
  };
}

function createFlatTree(): AccessibilityNode {
  return {
    role: 'document',
    name: 'Flat',
    children: [
      { role: 'button', name: 'Click me', children: [] },
      { role: 'textbox', name: 'Enter text', children: [] },
      { role: 'link', name: 'Go somewhere', children: [] },
    ],
  };
}

// Wrapper component to pass input signals
@Component({
  selector: 'a11y-test-host',
  standalone: true,
  imports: [AccessibilityTree],
  template: `<a11y-accessibility-tree [tree]="treeData()" />`,
})
class TestHost {
  readonly treeData = input<AccessibilityNode | null>(null);
}

describe('AccessibilityTree', () => {
  let fixture: ComponentFixture<TestHost>;
  let hostElement: HTMLElement;

  function createFixture(tree: AccessibilityNode | null) {
    fixture = TestBed.createComponent(TestHost);
    fixture.componentRef.setInput('treeData', tree);
    fixture.detectChanges();
    hostElement = fixture.nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should display empty message when tree is null', () => {
      createFixture(null);
      const msg = hostElement.querySelector('.tree-empty-message');
      expect(msg).toBeTruthy();
      expect(msg!.textContent).toContain(
        'No accessibility tree data available',
      );
    });

    it('should render a tree with role="tree" on the root ul', () => {
      createFixture(createFlatTree());
      const rootUl = hostElement.querySelector('ul[role="tree"]');
      expect(rootUl).toBeTruthy();
    });

    it('should render treeitems with role="treeitem"', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll('li[role="treeitem"]');
      expect(items.length).toBe(3);
    });

    it('should display role and name for each node', () => {
      createFixture(createFlatTree());
      const labels = hostElement.querySelectorAll('.tree-node-label');
      expect(labels[0]?.textContent).toContain('button');
      expect(labels[0]?.textContent).toContain('"Click me"');
      expect(labels[1]?.textContent).toContain('textbox');
      expect(labels[1]?.textContent).toContain('"Enter text"');
    });

    it('should display level for heading nodes', () => {
      createFixture(createTestTree());
      // Nodes start expanded, so heading is already visible
      const labels = hostElement.querySelectorAll('.tree-node-label');
      const headingLabel = Array.from(labels).find((l) =>
        l.textContent?.includes('heading'),
      );
      expect(headingLabel?.textContent).toContain('level:');
      expect(headingLabel?.textContent).toContain('1');
    });

    it('should render nested ul with role="group" for expanded children', () => {
      createFixture(createTestTree());
      // Nodes start expanded — groups are visible
      const groups = hostElement.querySelectorAll('ul[role="group"]');
      expect(groups.length).toBeGreaterThan(0);

      // Collapse the first item (banner)
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;
      firstItem?.querySelector<HTMLElement>('.tree-node-content')?.click();
      fixture.detectChanges();

      // The collapsed node should no longer have its group
      const firstItemGroup = firstItem.querySelector('ul[role="group"]');
      expect(firstItemGroup).toBeNull();
    });

    it('should set aria-expanded on nodes with children', () => {
      createFixture(createTestTree());
      const items = hostElement.querySelectorAll('li[role="treeitem"]');
      // banner has children — expanded by default
      expect(items[0]?.getAttribute('aria-expanded')).toBe('true');
      // All nodes with children start expanded
      const nodesWithChildren = Array.from(items).filter(
        (item) => item.getAttribute('aria-expanded') !== null,
      );
      nodesWithChildren.forEach((item) => {
        expect(item.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('should not set aria-expanded on leaf nodes', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll('li[role="treeitem"]');
      items.forEach((item) => {
        expect(item.getAttribute('aria-expanded')).toBeNull();
      });
    });

    it('should set aria-level attributes', () => {
      createFixture(createTestTree());
      // Since nodes start expanded, all items are visible. Check top-level items.
      const topLevelItems = hostElement.querySelectorAll(
        ':scope ul[role="tree"] > a11y-accessibility-tree-node > li[role="treeitem"]',
      );
      expect(topLevelItems[0]?.getAttribute('aria-level')).toBe('1');
      expect(topLevelItems[1]?.getAttribute('aria-level')).toBe('1');
    });

    it('should set aria-setsize and aria-posinset', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll('li[role="treeitem"]');
      expect(items[0]?.getAttribute('aria-setsize')).toBe('3');
      expect(items[0]?.getAttribute('aria-posinset')).toBe('1');
      expect(items[1]?.getAttribute('aria-posinset')).toBe('2');
      expect(items[2]?.getAttribute('aria-posinset')).toBe('3');
    });
  });

  describe('expand/collapse', () => {
    it('should collapse node on click and re-expand on second click', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');

      // First click collapses
      firstItem?.querySelector<HTMLElement>('.tree-node-content')?.click();
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');
      expect(firstItem.querySelector('ul[role="group"]')).toBeNull();

      // Second click expands again
      firstItem?.querySelector<HTMLElement>('.tree-node-content')?.click();
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');
      expect(firstItem.querySelector('ul[role="group"]')).toBeTruthy();
    });

    it('should collapse expanded node on click', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');

      // Click to collapse
      firstItem?.querySelector<HTMLElement>('.tree-node-content')?.click();
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show child nodes when expanded', () => {
      createFixture(createTestTree());
      // Nodes start expanded, so children are immediately visible
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      const group = firstItem.querySelector('ul[role="group"]');
      const childItems = group?.querySelectorAll(
        ':scope > a11y-accessibility-tree-node > li[role="treeitem"]',
      );
      // banner has 2 children: heading + navigation
      expect(childItems?.length).toBe(2);
    });

    it('should show expand indicator for parent nodes', () => {
      createFixture(createTestTree());
      // Arrow element exists and has the expanded class
      const firstArrow = hostElement.querySelector('.tree-node-arrow');
      expect(firstArrow).toBeTruthy();
      expect(firstArrow?.classList.contains('tree-node-arrow--expanded')).toBe(
        true,
      );
    });

    it('should change indicator when collapsed', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded, click to collapse
      firstItem?.querySelector<HTMLElement>('.tree-node-content')?.click();
      fixture.detectChanges();

      const arrow = firstItem.querySelector('.tree-node-arrow');
      expect(arrow?.classList.contains('tree-node-arrow--expanded')).toBe(
        false,
      );
    });

    it('should show leaf indicator for leaf nodes', () => {
      createFixture(createFlatTree());
      const arrows = hostElement.querySelectorAll('.tree-node-arrow');
      arrows.forEach((arrow) => {
        expect(arrow.classList.contains('tree-node-arrow--leaf')).toBe(true);
      });
    });
  });

  describe('keyboard navigation', () => {
    function pressKey(element: HTMLElement, key: string): void {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
    }

    it('should move focus down with ArrowDown', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[0].focus();
      pressKey(items[0], 'ArrowDown');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[1]);
    });

    it('should move focus up with ArrowUp', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[1].focus();
      pressKey(items[1], 'ArrowUp');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[0]);
    });

    it('should move to first item with Home key', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[2].focus();
      pressKey(items[2], 'Home');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[0]);
    });

    it('should move to last item with End key', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[0].focus();
      pressKey(items[0], 'End');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[2]);
    });

    it('should expand collapsed node with ArrowRight', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // First collapse the node so we can test ArrowRight expanding it
      firstItem.focus();
      pressKey(firstItem, 'ArrowLeft');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');

      // ArrowRight should expand
      pressKey(firstItem, 'ArrowRight');
      fixture.detectChanges();

      expect(firstItem.getAttribute('aria-expanded')).toBe('true');
    });

    it('should collapse expanded node with ArrowLeft', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded
      firstItem.focus();
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');

      // ArrowLeft should collapse
      pressKey(firstItem, 'ArrowLeft');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');
    });

    it('should toggle expand with Enter key', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');

      // Press Enter to collapse
      firstItem.focus();
      pressKey(firstItem, 'Enter');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');

      // Press Enter again to expand
      pressKey(firstItem, 'Enter');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle expand with Space key', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Starts expanded
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');

      // Press Space to collapse
      firstItem.focus();
      pressKey(firstItem, ' ');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('false');

      // Press Space again to expand
      pressKey(firstItem, ' ');
      fixture.detectChanges();
      expect(firstItem.getAttribute('aria-expanded')).toBe('true');
    });

    it('should move to parent with ArrowLeft on leaf node', () => {
      createFixture(createTestTree());
      const firstItem = hostElement.querySelector(
        'li[role="treeitem"]',
      ) as HTMLElement;

      // Nodes start expanded, so children are already visible
      const group = firstItem.querySelector('ul[role="group"]');
      const childItems = group?.querySelectorAll(
        ':scope > a11y-accessibility-tree-node > li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;
      childItems[0].focus();

      // ArrowLeft on leaf should go to parent
      pressKey(childItems[0], 'ArrowLeft');
      fixture.detectChanges();

      expect(document.activeElement).toBe(firstItem);
    });

    it('should not move past the first item with ArrowUp', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[0].focus();
      pressKey(items[0], 'ArrowUp');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[0]);
    });

    it('should not move past the last item with ArrowDown', () => {
      createFixture(createFlatTree());
      const items = hostElement.querySelectorAll(
        'li[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;

      items[2].focus();
      pressKey(items[2], 'ArrowDown');
      fixture.detectChanges();

      expect(document.activeElement).toBe(items[2]);
    });
  });
});
