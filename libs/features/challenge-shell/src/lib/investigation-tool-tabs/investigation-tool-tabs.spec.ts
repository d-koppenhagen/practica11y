import { render, screen, fireEvent } from '@testing-library/angular';
import { InvestigationToolTabs } from './investigation-tool-tabs';
import { TreeTab } from '@practica11y/util';

describe('InvestigationToolTabs', () => {
  async function setup(
    activeTab: TreeTab,
    onTabActivated?: (tab: TreeTab) => void,
  ) {
    return render(InvestigationToolTabs, {
      inputs: { activeTab },
      on: {
        tabActivated:
          onTabActivated ??
          (() => {
            /* noop */
          }),
      },
    });
  }

  describe('keyboard navigation', () => {
    it('should move focus from "Accessibility Tree" to "Virtual Screen Reader" on ArrowRight', async () => {
      await setup('tree');
      const treeTab = screen.getByRole('tab', { name: /accessibility tree/i });
      treeTab.focus();
      fireEvent.keyDown(treeTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /virtual screen reader/i }),
      );
    });

    it('should wrap from "Color Contrast" to "Accessibility Tree" on ArrowRight', async () => {
      await setup('color-contrast');
      const lastTab = screen.getByRole('tab', { name: /color contrast/i });
      lastTab.focus();
      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /accessibility tree/i }),
      );
    });

    it('should wrap from "Accessibility Tree" to "Color Contrast" on ArrowLeft', async () => {
      await setup('tree');
      const firstTab = screen.getByRole('tab', {
        name: /accessibility tree/i,
      });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /color contrast/i }),
      );
    });
  });

  describe('ARIA attributes', () => {
    it('should set aria-selected="true" and tabindex="0" on the active tab', async () => {
      await setup('screen-reader');
      const activeTab = screen.getByRole('tab', {
        name: /virtual screen reader/i,
      });
      expect(activeTab.getAttribute('aria-selected')).toBe('true');
      expect(activeTab.getAttribute('tabindex')).toBe('0');
    });

    it('should set aria-selected="false" and tabindex="-1" on inactive tabs', async () => {
      await setup('tree');
      const srTab = screen.getByRole('tab', {
        name: /virtual screen reader/i,
      });
      const ccTab = screen.getByRole('tab', { name: /color contrast/i });

      expect(srTab.getAttribute('aria-selected')).toBe('false');
      expect(srTab.getAttribute('tabindex')).toBe('-1');
      expect(ccTab.getAttribute('aria-selected')).toBe('false');
      expect(ccTab.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('tab activation output', () => {
    it('should emit the correct tab identifier when clicking a tab', async () => {
      const onTabActivated = vi.fn();
      await setup('tree', onTabActivated);

      const srTab = screen.getByRole('tab', {
        name: /virtual screen reader/i,
      });
      fireEvent.click(srTab);

      expect(onTabActivated).toHaveBeenCalledWith('screen-reader');
    });

    it('should emit the next tab identifier on ArrowRight', async () => {
      const onTabActivated = vi.fn();
      await setup('tree', onTabActivated);

      const treeTab = screen.getByRole('tab', { name: /accessibility tree/i });
      treeTab.focus();
      fireEvent.keyDown(treeTab, { key: 'ArrowRight' });

      expect(onTabActivated).toHaveBeenCalledWith('screen-reader');
    });
  });
});
