import { render, screen } from '@testing-library/angular';
import { CheatAnimation } from './cheat-animation';

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('CheatAnimation', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('should become visible when trigger is true and emit animationComplete after timeout', async () => {
    vi.useFakeTimers();
    const onAnimationComplete = vi.fn();

    const { fixture } = await render(CheatAnimation, {
      inputs: { trigger: false },
      on: { animationComplete: onAnimationComplete },
    });

    // Trigger the animation
    fixture.componentRef.setInput('trigger', true);
    fixture.detectChanges();
    await fixture.whenStable();

    // Animation container should be visible
    const container = fixture.nativeElement.querySelector(
      '.cheat-animation-container',
    );
    expect(container).not.toBeNull();

    // Should not have emitted yet
    expect(onAnimationComplete).not.toHaveBeenCalled();

    // Advance time by 2000ms (normal duration)
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    // Should have emitted animationComplete
    expect(onAnimationComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should use shorter duration (750ms) when reduced motion is preferred', async () => {
    vi.useFakeTimers();
    mockMatchMedia(true);

    const onAnimationComplete = vi.fn();

    const { fixture } = await render(CheatAnimation, {
      inputs: { trigger: false },
      on: { animationComplete: onAnimationComplete },
    });

    // Trigger the animation
    fixture.componentRef.setInput('trigger', true);
    fixture.detectChanges();
    await fixture.whenStable();

    // Should not emit before 750ms
    vi.advanceTimersByTime(749);
    fixture.detectChanges();
    expect(onAnimationComplete).not.toHaveBeenCalled();

    // Should emit at 750ms
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(onAnimationComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should have aria-hidden="true" on the decorative container', async () => {
    vi.useFakeTimers();

    const { fixture } = await render(CheatAnimation, {
      inputs: { trigger: false },
    });

    fixture.componentRef.setInput('trigger', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const container = fixture.nativeElement.querySelector(
      '.cheat-animation-container',
    );
    expect(container).not.toBeNull();
    expect(container!.getAttribute('aria-hidden')).toBe('true');

    vi.useRealTimers();
  });

  it('should announce "Revealing solution…" via a live region with role="status"', async () => {
    vi.useFakeTimers();

    const { fixture } = await render(CheatAnimation, {
      inputs: { trigger: false },
    });

    fixture.componentRef.setInput('trigger', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.textContent?.trim()).toBe('Revealing solution…');

    vi.useRealTimers();
  });

  it('should cancel animation timeout when component is destroyed', async () => {
    vi.useFakeTimers();
    const onAnimationComplete = vi.fn();

    const { fixture } = await render(CheatAnimation, {
      inputs: { trigger: false },
      on: { animationComplete: onAnimationComplete },
    });

    // Trigger the animation
    fixture.componentRef.setInput('trigger', true);
    fixture.detectChanges();
    await fixture.whenStable();

    // Animation should be visible
    const container = fixture.nativeElement.querySelector(
      '.cheat-animation-container',
    );
    expect(container).not.toBeNull();

    // Destroy the component before timeout fires
    fixture.destroy();

    // Advance time past the animation duration
    vi.advanceTimersByTime(3000);

    // animationComplete should NOT have been emitted since component was destroyed
    expect(onAnimationComplete).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
