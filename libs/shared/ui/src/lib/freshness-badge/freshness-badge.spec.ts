import { render } from '@testing-library/angular';
import { FreshnessBadge } from './freshness-badge';

describe('FreshnessBadge', () => {
  function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  async function setup(createdAt: string, updatedAt?: string) {
    const { fixture } = await render(FreshnessBadge, {
      inputs: { createdAt, updatedAt },
    });
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  describe('New badge', () => {
    it('should show "New" when createdAt is within 14 days', async () => {
      const { el } = await setup(daysAgo(3));
      const badge = el.querySelector('.freshness-badge--new');
      expect(badge).not.toBeNull();
      expect(badge!.textContent).toContain('New');
    });

    it('should show "New" on the boundary (exactly 14 days old)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-24T00:00:00.000Z'));

      const { el } = await setup('2026-07-10');

      expect(el.querySelector('.freshness-badge--new')).not.toBeNull();
      vi.useRealTimers();
    });

    it('should not show "New" when createdAt is older than 14 days', async () => {
      const { el } = await setup(daysAgo(15));
      const badge = el.querySelector('.freshness-badge--new');
      expect(badge).toBeNull();
    });

    it('should mark the badge as aria-hidden', async () => {
      const { el } = await setup(daysAgo(1));
      const badge = el.querySelector('.freshness-badge--new');
      expect(badge!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Updated badge', () => {
    it('should show "Updated" when updatedAt is within 14 days and createdAt is old', async () => {
      const { el } = await setup(daysAgo(30), daysAgo(5));
      const badge = el.querySelector('.freshness-badge--updated');
      expect(badge).not.toBeNull();
      expect(badge!.textContent).toContain('Updated');
    });

    it('should not show "Updated" when updatedAt is older than 14 days', async () => {
      const { el } = await setup(daysAgo(30), daysAgo(20));
      const badge = el.querySelector('.freshness-badge--updated');
      expect(badge).toBeNull();
    });

    it('should mark the badge as aria-hidden', async () => {
      const { el } = await setup(daysAgo(30), daysAgo(2));
      const badge = el.querySelector('.freshness-badge--updated');
      expect(badge!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('priority', () => {
    it('should show "New" instead of "Updated" when both are within 14 days', async () => {
      const { el } = await setup(daysAgo(3), daysAgo(1));
      const newBadge = el.querySelector('.freshness-badge--new');
      const updatedBadge = el.querySelector('.freshness-badge--updated');
      expect(newBadge).not.toBeNull();
      expect(updatedBadge).toBeNull();
    });
  });

  describe('no badge', () => {
    it('should render nothing when both dates are old', async () => {
      const { el } = await setup(daysAgo(30), daysAgo(20));
      const badge = el.querySelector('.freshness-badge');
      expect(badge).toBeNull();
    });

    it('should render nothing when only createdAt is old and no updatedAt', async () => {
      const { el } = await setup(daysAgo(30));
      const badge = el.querySelector('.freshness-badge');
      expect(badge).toBeNull();
    });
  });
});
