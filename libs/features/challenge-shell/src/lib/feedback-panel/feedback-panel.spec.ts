import { render, screen, fireEvent } from '@testing-library/angular';
import { Component, input } from '@angular/core';
import { DeferBlockState } from '@angular/core/testing';
import { AnalysisPipelineResult } from '@practica11y/types';
import { EmptyAction } from '@practica11y/ui';
import { FeedbackPanel, FeedbackState } from './feedback-panel';

@Component({
  selector: 'a11y-challenge-feedback',
  template: '<div class="mock-feedback">Mock Feedback</div>',
})
class MockChallengeFeedback {
  readonly result = input<AnalysisPipelineResult | null>(null);
}

describe('FeedbackPanel — button state', () => {
  async function setup(onCheckSolution?: () => void) {
    return render(FeedbackPanel, {
      inputs: { state: 'button' as FeedbackState, analysisResult: null },
      on: {
        checkSolution:
          onCheckSolution ??
          (() => {
            /* noop */
          }),
      },
      componentImports: [MockChallengeFeedback, EmptyAction],
    });
  }

  it('should render a "Check Solution" button', async () => {
    await setup();
    expect(
      screen.getByRole('button', { name: /check solution/i }),
    ).toBeTruthy();
  });

  it('should emit checkSolution event when button is clicked', async () => {
    const onCheckSolution = vi.fn();
    await setup(onCheckSolution);
    const button = screen.getByRole('button', { name: /check solution/i });
    fireEvent.click(button);
    expect(onCheckSolution).toHaveBeenCalledTimes(1);
  });
});

describe('FeedbackPanel — loading state', () => {
  async function setup() {
    return render(FeedbackPanel, {
      inputs: { state: 'loading' as FeedbackState, analysisResult: null },
      componentImports: [MockChallengeFeedback, EmptyAction],
    });
  }

  it('should render a status container with role="status" and aria-live="polite"', async () => {
    await setup();
    const statusEl = screen.getByRole('status');
    expect(statusEl).toBeTruthy();
    expect(statusEl.getAttribute('aria-live')).toBe('polite');
  });

  it('should display "Analyzing…" text', async () => {
    await setup();
    expect(screen.getByText('Analyzing…')).toBeTruthy();
  });
});

describe('FeedbackPanel — results state', () => {
  async function setup() {
    const { fixture } = await render(FeedbackPanel, {
      inputs: { state: 'results' as FeedbackState, analysisResult: null },
      componentImports: [MockChallengeFeedback, EmptyAction],
      deferBlockStates: DeferBlockState.Complete,
    });
    return { fixture };
  }

  it('should render the ChallengeFeedback component', async () => {
    const { fixture } = await setup();
    const feedbackEl = fixture.nativeElement.querySelector(
      'a11y-challenge-feedback',
    );
    expect(feedbackEl).toBeTruthy();
  });

  it('should have an aria-live="polite" aria-atomic="true" container', async () => {
    const { fixture } = await setup();
    const container = fixture.nativeElement.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    expect(container).toBeTruthy();
  });
});

describe('FeedbackPanel — state transitions', () => {
  it('should remove the button when transitioning from "button" to "loading"', async () => {
    const { rerender } = await render(FeedbackPanel, {
      inputs: { state: 'button' as FeedbackState, analysisResult: null },
      componentImports: [MockChallengeFeedback, EmptyAction],
    });

    expect(
      screen.getByRole('button', { name: /check solution/i }),
    ).toBeTruthy();

    await rerender({ inputs: { state: 'loading', analysisResult: null } });

    expect(
      screen.queryByRole('button', { name: /check solution/i }),
    ).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
