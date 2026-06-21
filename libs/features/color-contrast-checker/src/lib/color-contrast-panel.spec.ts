import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ColorContrastPanel } from './color-contrast-panel';

function dispatchColorPickResult(
  payload = {
    foregroundColor: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
    fontSizePx: 16,
    fontWeight: 400,
  },
) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'color-pick-result', payload },
    }),
  );
}

function dispatchDomReady() {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'dom-ready' },
    }),
  );
}

describe('ColorContrastPanel', () => {
  let fixture: ComponentFixture<ColorContrastPanel>;
  let element: HTMLElement;
  let mockPostMessage: ReturnType<typeof vi.fn>;
  let mockIframe: HTMLIFrameElement;

  beforeEach(async () => {
    mockPostMessage = vi.fn();
    mockIframe = {
      contentWindow: { postMessage: mockPostMessage },
    } as unknown as HTMLIFrameElement;

    await TestBed.configureTestingModule({
      imports: [ColorContrastPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorContrastPanel);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty state', () => {
    it('should show instructional text when no element is selected', () => {
      const emptyAction = element.querySelector('.empty-action');
      expect(emptyAction).not.toBeNull();
      const button = element.querySelector('.pick-button-full');
      expect(button).not.toBeNull();
      expect(button!.textContent).toContain('Pick element');
    });

    it('should not display ratio when no element is selected', () => {
      const ratioDisplay = element.querySelector('.ratio-display');
      expect(ratioDisplay).toBeNull();
    });

    it('should not display color swatches when no element is selected', () => {
      const swatches = element.querySelector('.color-swatches');
      expect(swatches).toBeNull();
    });

    it('should not display conformance indicators when no element is selected', () => {
      const conformance = element.querySelector('.conformance-grid');
      expect(conformance).toBeNull();
    });
  });

  describe('Picker activation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should set aria-pressed="true" when pick button is clicked', () => {
      const button = element.querySelector(
        '.pick-button-full',
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-pressed')).toBe('false');

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('should send enable-color-picker message when button is clicked', () => {
      const button = element.querySelector(
        '.pick-button-full',
      ) as HTMLButtonElement;

      button.click();
      fixture.detectChanges();

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'enable-color-picker' },
        '*',
      );
    });
  });

  describe('Manual deactivation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should send disable-color-picker message when button is clicked while active', () => {
      const button = element.querySelector(
        '.pick-button-full',
      ) as HTMLButtonElement;

      // Activate
      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-pressed')).toBe('true');

      // Deactivate
      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'disable-color-picker' },
        '*',
      );
    });
  });

  describe('Picker deactivation on result', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should set aria-pressed="false" when color-pick-result is received', () => {
      const button = element.querySelector(
        '.pick-button-full',
      ) as HTMLButtonElement;

      // Activate picker
      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-pressed')).toBe('true');

      // Receive result — panel switches to result view with .pick-button
      dispatchColorPickResult();
      fixture.detectChanges();

      const resultButton = element.querySelector(
        '.pick-button',
      ) as HTMLButtonElement;
      expect(resultButton.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('Result display', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should show color swatches with hex values after receiving result', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const labels = element.querySelectorAll('.swatch-label');
      const labelTexts = Array.from(labels).map((l) => l.textContent);
      expect(labelTexts).toContain('#000000');
      expect(labelTexts).toContain('#FFFFFF');
    });

    it('should show contrast ratio after receiving result', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const ratioValue = element.querySelector('.ratio-value');
      expect(ratioValue).not.toBeNull();
      expect(ratioValue!.textContent).toContain('21.00:1');
    });

    it('should show conformance indicators after receiving result', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const levels = element.querySelectorAll('.conformance-level');
      const levelTexts = Array.from(levels).map((l) => l.textContent);
      expect(levelTexts).toContain('AA Normal');
      expect(levelTexts).toContain('AA Large');
      expect(levelTexts).toContain('AAA Normal');
      expect(levelTexts).toContain('AAA Large');
    });

    it('should show correct aria-labels on swatches with hex and role', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const fgSwatch = element.querySelector(
        '[aria-label="Foreground color: #000000"]',
      );
      const bgSwatch = element.querySelector(
        '[aria-label="Background color: #FFFFFF"]',
      );
      expect(fgSwatch).not.toBeNull();
      expect(bgSwatch).not.toBeNull();
    });

    it('should set role="img" on color swatches', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const fgSwatch = element.querySelector(
        '[aria-label="Foreground color: #000000"]',
      );
      const bgSwatch = element.querySelector(
        '[aria-label="Background color: #FFFFFF"]',
      );
      expect(fgSwatch!.getAttribute('role')).toBe('img');
      expect(bgSwatch!.getAttribute('role')).toBe('img');
    });
  });

  describe('Large text badge', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should show "Large Text" badge when font qualifies as large text', () => {
      dispatchColorPickResult({
        foregroundColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSizePx: 24,
        fontWeight: 400,
      });
      fixture.detectChanges();

      const badge = element.querySelector('.large-text-badge');
      expect(badge).not.toBeNull();
      expect(badge!.textContent).toContain('Large Text');
    });

    it('should not show "Large Text" badge when font does not qualify', () => {
      dispatchColorPickResult({
        foregroundColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSizePx: 16,
        fontWeight: 400,
      });
      fixture.detectChanges();

      const badge = element.querySelector('.large-text-badge');
      expect(badge).toBeNull();
    });
  });

  describe('Error state', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should show error message when color cannot be parsed', () => {
      dispatchColorPickResult({
        foregroundColor: 'not-a-color',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSizePx: 16,
        fontWeight: 400,
      });
      fixture.detectChanges();

      const errorState = element.querySelector('.error-state');
      expect(errorState).not.toBeNull();
      expect(errorState!.textContent).toContain(
        'Could not calculate contrast ratio',
      );
    });

    it('should not display ratio when there is an error', () => {
      dispatchColorPickResult({
        foregroundColor: 'not-a-color',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSizePx: 16,
        fontWeight: 400,
      });
      fixture.detectChanges();

      const ratioDisplay = element.querySelector('.ratio-display');
      expect(ratioDisplay).toBeNull();
    });
  });

  describe('Iframe reload (dom-ready)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should clear results and return to empty state on dom-ready', () => {
      // First show a result
      dispatchColorPickResult();
      fixture.detectChanges();
      expect(element.querySelector('.ratio-display')).not.toBeNull();

      // Simulate iframe reload
      dispatchDomReady();
      fixture.detectChanges();

      // Should return to empty state
      expect(element.querySelector('.ratio-display')).toBeNull();
      expect(element.querySelector('.color-swatches')).toBeNull();
      expect(element.querySelector('.conformance-grid')).toBeNull();
      expect(element.querySelector('.empty-action')).not.toBeNull();
    });
  });

  describe('ARIA attributes', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sandboxIframe', mockIframe);
      fixture.detectChanges();
    });

    it('should have aria-live="polite" on the ratio region', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const ratioRegion = element.querySelector('.ratio-display');
      expect(ratioRegion).not.toBeNull();
      expect(ratioRegion!.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-atomic="true" on the ratio region', () => {
      dispatchColorPickResult();
      fixture.detectChanges();

      const ratioRegion = element.querySelector('.ratio-display');
      expect(ratioRegion!.getAttribute('aria-atomic')).toBe('true');
    });
  });
});
