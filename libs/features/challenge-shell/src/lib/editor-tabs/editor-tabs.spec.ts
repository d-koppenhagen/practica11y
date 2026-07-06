import { render, screen, fireEvent } from '@testing-library/angular';
import { EditorTabs } from './editor-tabs';
import { EditorFileType } from '@practica11y/editor-types';

describe('EditorTabs — roving tabindex navigation', () => {
  async function setup(tabs: EditorFileType[], activeTab: EditorFileType) {
    return render(EditorTabs, {
      inputs: { tabs, activeTab },
    });
  }

  describe('ArrowRight navigation', () => {
    it('should move focus from first tab to second tab', async () => {
      await setup(['html', 'js', 'css', 'vtt'], 'html');
      const firstTab = screen.getByRole('tab', { name: /html/i });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /js/i }),
      );
    });

    it('should wrap from last tab to first tab (circular)', async () => {
      await setup(['html', 'js', 'css', 'vtt'], 'vtt');
      const lastTab = screen.getByRole('tab', { name: /vtt/i });
      lastTab.focus();
      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /html/i }),
      );
    });

    it('should wrap from last tab to first with 2 tabs', async () => {
      await setup(['html', 'css'], 'css');
      const lastTab = screen.getByRole('tab', { name: /css/i });
      lastTab.focus();
      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /html/i }),
      );
    });

    it('should wrap from last tab to first with 3 tabs', async () => {
      await setup(['html', 'js', 'css'], 'css');
      const lastTab = screen.getByRole('tab', { name: /css/i });
      lastTab.focus();
      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /html/i }),
      );
    });
  });

  describe('ArrowLeft navigation', () => {
    it('should wrap from first tab to last tab (circular)', async () => {
      await setup(['html', 'js', 'css', 'vtt'], 'html');
      const firstTab = screen.getByRole('tab', { name: /html/i });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /vtt/i }),
      );
    });

    it('should move focus from second tab to first tab', async () => {
      await setup(['html', 'js', 'css', 'vtt'], 'js');
      const secondTab = screen.getByRole('tab', { name: /js/i });
      secondTab.focus();
      fireEvent.keyDown(secondTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /html/i }),
      );
    });

    it('should wrap from first tab to last with 2 tabs', async () => {
      await setup(['html', 'css'], 'html');
      const firstTab = screen.getByRole('tab', { name: /html/i });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /css/i }),
      );
    });

    it('should wrap from first tab to last with 3 tabs', async () => {
      await setup(['html', 'js', 'css'], 'html');
      const firstTab = screen.getByRole('tab', { name: /html/i });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /css/i }),
      );
    });
  });

  describe('focus verification across tab counts', () => {
    it('should move focus correctly with 4 tabs (middle navigation)', async () => {
      await setup(['html', 'js', 'css', 'vtt'], 'css');
      const cssTab = screen.getByRole('tab', { name: /css/i });
      cssTab.focus();
      fireEvent.keyDown(cssTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /vtt/i }),
      );
    });

    it('should move focus correctly with 3 tabs (middle navigation)', async () => {
      await setup(['html', 'js', 'css'], 'js');
      const jsTab = screen.getByRole('tab', { name: /js/i });
      jsTab.focus();
      fireEvent.keyDown(jsTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /css/i }),
      );
    });

    it('should move focus correctly with 2 tabs (ArrowLeft from second)', async () => {
      await setup(['html', 'css'], 'css');
      const cssTab = screen.getByRole('tab', { name: /css/i });
      cssTab.focus();
      fireEvent.keyDown(cssTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: /html/i }),
      );
    });
  });
});

describe('EditorTabs — conditional tab set', () => {
  async function setup(tabs: EditorFileType[], activeTab: EditorFileType) {
    return render(EditorTabs, {
      inputs: { tabs, activeTab },
    });
  }

  it('should render 4 tabs when all are present', async () => {
    await setup(['html', 'js', 'css', 'vtt'], 'html');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });

  it('should render 3 tabs when JS content is absent', async () => {
    await setup(['html', 'css', 'vtt'], 'html');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.queryByRole('tab', { name: /js/i })).toBeNull();
  });

  it('should render 3 tabs when VTT content is absent', async () => {
    await setup(['html', 'js', 'css'], 'html');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.queryByRole('tab', { name: /vtt/i })).toBeNull();
  });

  it('should render 2 tabs in the minimal case (HTML + CSS only)', async () => {
    await setup(['html', 'css'], 'html');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(screen.queryByRole('tab', { name: /js/i })).toBeNull();
    expect(screen.queryByRole('tab', { name: /vtt/i })).toBeNull();
  });
});

describe('EditorTabs — tab activation output', () => {
  async function setup(
    tabs: EditorFileType[],
    activeTab: EditorFileType,
    onTabActivated?: (tab: EditorFileType) => void,
  ) {
    return render(EditorTabs, {
      inputs: { tabs, activeTab },
      on: {
        tabActivated:
          onTabActivated ??
          (() => {
            /* noop */
          }),
      },
    });
  }

  it('should emit the correct tab identifier when clicking a tab', async () => {
    const onTabActivated = vi.fn();
    await setup(['html', 'js', 'css'], 'html', onTabActivated);
    const jsTab = screen.getByRole('tab', { name: /js/i });
    fireEvent.click(jsTab);
    expect(onTabActivated).toHaveBeenCalledWith('js');
  });

  it('should emit the next tab identifier on ArrowRight', async () => {
    const onTabActivated = vi.fn();
    await setup(['html', 'js', 'css'], 'html', onTabActivated);
    const htmlTab = screen.getByRole('tab', { name: /html/i });
    htmlTab.focus();
    fireEvent.keyDown(htmlTab, { key: 'ArrowRight' });
    expect(onTabActivated).toHaveBeenCalledWith('js');
  });

  it('should emit the previous tab identifier on ArrowLeft', async () => {
    const onTabActivated = vi.fn();
    await setup(['html', 'js', 'css'], 'js', onTabActivated);
    const jsTab = screen.getByRole('tab', { name: /js/i });
    jsTab.focus();
    fireEvent.keyDown(jsTab, { key: 'ArrowLeft' });
    expect(onTabActivated).toHaveBeenCalledWith('html');
  });
});
