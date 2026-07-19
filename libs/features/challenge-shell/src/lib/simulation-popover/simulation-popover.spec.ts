import { render, screen, fireEvent } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { SimulationPopover } from './simulation-popover';
import { PreferenceSimulationStore } from '@practica11y/util';

describe('SimulationPopover', () => {
  let store: PreferenceSimulationStore;

  async function setup() {
    const result = await render(SimulationPopover);
    store = TestBed.inject(PreferenceSimulationStore);
    return result;
  }

  function getToggleButton() {
    return screen.getByRole('button', {
      name: 'Simulate user preferences',
    });
  }

  function openMenu() {
    fireEvent.click(getToggleButton());
  }

  describe('toggle button opens/closes menu', () => {
    it('should not show the menu initially', async () => {
      await setup();
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('should open the menu when the button is clicked', async () => {
      await setup();
      openMenu();
      expect(screen.getByRole('menu')).toBeTruthy();
    });

    it('should close the menu when the button is clicked again', async () => {
      await setup();
      openMenu();
      fireEvent.click(getToggleButton());
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('aria-expanded reflects open state', () => {
    it('should have aria-expanded=false when menu is closed', async () => {
      await setup();
      expect(getToggleButton().getAttribute('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded=true when menu is open', async () => {
      await setup();
      openMenu();
      expect(getToggleButton().getAttribute('aria-expanded')).toBe('true');
    });

    it('should return to aria-expanded=false after closing', async () => {
      await setup();
      openMenu();
      fireEvent.click(getToggleButton());
      expect(getToggleButton().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('menu item selections update store values', () => {
    it('should update reducedMotion to reduce when selected', async () => {
      await setup();
      openMenu();

      const reduceItem = screen.getByRole('menuitemradio', { name: 'Reduce' });
      fireEvent.click(reduceItem);
      expect(store.reducedMotion()).toBe('reduce');
    });

    it('should update colorScheme to dark when selected', async () => {
      await setup();
      openMenu();

      const darkItem = screen.getByRole('menuitemradio', { name: 'Dark' });
      fireEvent.click(darkItem);
      expect(store.colorScheme()).toBe('dark');
    });

    it('should update contrast to more when selected', async () => {
      await setup();
      openMenu();

      const moreItem = screen.getByRole('menuitemradio', { name: 'More' });
      fireEvent.click(moreItem);
      expect(store.contrast()).toBe('more');
    });

    it('should update contrast to less when selected', async () => {
      await setup();
      openMenu();

      const lessItem = screen.getByRole('menuitemradio', { name: 'Less' });
      fireEvent.click(lessItem);
      expect(store.contrast()).toBe('less');
    });

    it('should update contrast to custom when selected', async () => {
      await setup();
      openMenu();

      const customItem = screen.getByRole('menuitemradio', {
        name: 'Custom',
      });
      fireEvent.click(customItem);
      expect(store.contrast()).toBe('custom');
    });
  });

  describe('Escape key closes menu', () => {
    it('should close menu when Escape is pressed on the menu', async () => {
      await setup();
      openMenu();

      const menu = screen.getByRole('menu');
      fireEvent.keyDown(menu, { key: 'Escape' });
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('should close menu when Escape is pressed on the button', async () => {
      await setup();
      openMenu();
      fireEvent.keyDown(getToggleButton(), { key: 'Escape' });
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('default selections reflect store defaults', () => {
    it('should mark no-preference as checked for reduced motion', async () => {
      await setup();
      openMenu();

      const noPreferenceItems = screen.getAllByRole('menuitemradio', {
        name: 'No preference',
      });
      // First "No preference" is in the Reduced Motion group
      expect(noPreferenceItems[0].getAttribute('aria-checked')).toBe('true');
    });

    it('should mark light as checked for color scheme', async () => {
      await setup();
      openMenu();

      const lightItem = screen.getByRole('menuitemradio', { name: 'Light' });
      expect(lightItem.getAttribute('aria-checked')).toBe('true');
    });

    it('should mark reduce as unchecked by default', async () => {
      await setup();
      openMenu();

      const reduceItem = screen.getByRole('menuitemradio', { name: 'Reduce' });
      expect(reduceItem.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('menu groups use proper labels', () => {
    it('should display Reduced Motion group label', async () => {
      await setup();
      openMenu();

      expect(screen.getByText('Reduced Motion')).toBeTruthy();
    });

    it('should display Color Scheme group label', async () => {
      await setup();
      openMenu();

      expect(screen.getByText('Color Scheme')).toBeTruthy();
    });

    it('should display Contrast group label', async () => {
      await setup();
      openMenu();

      expect(screen.getByText('Contrast')).toBeTruthy();
    });
  });
});
