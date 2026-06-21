import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import axe from 'axe-core';
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

describe('ColorContrastPanel accessibility', () => {
  let fixture: ComponentFixture<ColorContrastPanel>;
  let element: HTMLElement;

  beforeEach(async () => {
    // Reset axe's internal running state to prevent cascading failures
    (axe as unknown as { _running: boolean })._running = false;

    await TestBed.configureTestingModule({
      imports: [ColorContrastPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorContrastPanel);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  async function runAxe(el: HTMLElement) {
    const results = await axe.run(el, {
      rules: {
        // Disable color-contrast rule as jsdom doesn't compute styles accurately
        'color-contrast': { enabled: false },
      },
    });
    return results;
  }

  it('should have no axe violations in empty state', async () => {
    const results = await runAxe(element);
    expect(results.violations).toEqual([]);
  });

  it('should have no axe violations with result displayed', async () => {
    dispatchColorPickResult();
    fixture.detectChanges();

    const results = await runAxe(element);
    expect(results.violations).toEqual([]);
  });

  it('should have no axe violations in error state', async () => {
    dispatchColorPickResult({
      foregroundColor: 'not-a-color',
      backgroundColor: 'rgb(255, 255, 255)',
      fontSizePx: 16,
      fontWeight: 400,
    });
    fixture.detectChanges();

    const results = await runAxe(element);
    expect(results.violations).toEqual([]);
  });

  it('should have no axe violations with large text result', async () => {
    dispatchColorPickResult({
      foregroundColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      fontSizePx: 24,
      fontWeight: 700,
    });
    fixture.detectChanges();

    const results = await runAxe(element);
    expect(results.violations).toEqual([]);
  });
});
