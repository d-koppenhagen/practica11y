import { render } from '@testing-library/angular';
import { ChallengeMetaBar } from './challenge-meta-bar';

describe('ChallengeMetaBar', () => {
  function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  async function setup(
    inputs: Partial<{
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      points: number;
      createdAt: string;
      updatedAt: string | undefined;
    }> = {},
  ) {
    const { fixture } = await render(ChallengeMetaBar, {
      inputs: {
        difficulty: 'beginner',
        points: 100,
        createdAt: '2026-01-15',
        updatedAt: undefined,
        ...inputs,
      },
    });
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('should render the meta bar container', async () => {
    const { el } = await setup();
    expect(el.querySelector('.meta-bar')).not.toBeNull();
  });

  it('should render a difficulty badge', async () => {
    const { el } = await setup({ difficulty: 'intermediate' });
    const badge = el.querySelector('.difficulty-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('intermediate');
    expect(badge!.classList.contains('difficulty-intermediate')).toBe(true);
  });

  it('should render a points badge', async () => {
    const { el } = await setup({ points: 250 });
    const badge = el.querySelector('.points-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('250');
    expect(badge!.textContent).toContain('Points');
  });

  it('should render a freshness badge when createdAt is recent', async () => {
    const { el } = await setup({ createdAt: daysAgo(3) });
    const badge = el.querySelector('.freshness-badge--new');
    expect(badge).not.toBeNull();
  });

  it('should not render a freshness badge when dates are old', async () => {
    const { el } = await setup({
      createdAt: daysAgo(30),
      updatedAt: undefined,
    });
    const badge = el.querySelector('.freshness-badge');
    expect(badge).toBeNull();
  });

  describe('date display', () => {
    it('should show "Created:" with a time element when no updatedAt', async () => {
      const { el } = await setup({
        createdAt: '2026-03-15',
        updatedAt: undefined,
      });
      const dateSpan = el.querySelector('.meta-date');
      expect(dateSpan).not.toBeNull();
      expect(dateSpan!.textContent).toContain('Created:');

      const timeEl = dateSpan!.querySelector('time');
      expect(timeEl).not.toBeNull();
      expect(timeEl!.getAttribute('datetime')).toBe('2026-03-15');
    });

    it('should show "Updated:" with a time element when updatedAt is set', async () => {
      const { el } = await setup({
        createdAt: '2026-01-01',
        updatedAt: '2026-06-20',
      });
      const dateSpan = el.querySelector('.meta-date');
      expect(dateSpan!.textContent).toContain('Updated:');

      const timeEl = dateSpan!.querySelector('time');
      expect(timeEl!.getAttribute('datetime')).toBe('2026-06-20');
    });

    it('should render a calendar icon that is hidden from assistive tech', async () => {
      const { el } = await setup();
      const svg = el.querySelector('.meta-date-icon');
      expect(svg).not.toBeNull();
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('input changes', () => {
    it('should update difficulty when input changes', async () => {
      const { fixture, el } = await setup({ difficulty: 'beginner' });
      expect(
        el
          .querySelector('.difficulty-badge')!
          .classList.contains('difficulty-beginner'),
      ).toBe(true);

      fixture.componentRef.setInput('difficulty', 'advanced');
      fixture.detectChanges();

      expect(
        el
          .querySelector('.difficulty-badge')!
          .classList.contains('difficulty-advanced'),
      ).toBe(true);
    });

    it('should update points when input changes', async () => {
      const { fixture, el } = await setup({ points: 50 });
      expect(el.querySelector('.points-badge')!.textContent).toContain('50');

      fixture.componentRef.setInput('points', 300);
      fixture.detectChanges();

      expect(el.querySelector('.points-badge')!.textContent).toContain('300');
    });
  });
});
