import { render } from '@testing-library/angular';
import { PointsBadge } from './points-badge';

describe('PointsBadge', () => {
  async function setup(points: number) {
    const { fixture } = await render(PointsBadge, {
      inputs: { points },
    });
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('should render the points value', async () => {
    const { el } = await setup(150);
    const badge = el.querySelector('.points-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('150');
  });

  it('should include "Points" label', async () => {
    const { el } = await setup(200);
    const badge = el.querySelector('.points-badge');
    expect(badge!.textContent).toContain('Points');
  });

  it('should render a star icon', async () => {
    const { el } = await setup(100);
    const svg = el.querySelector('.points-icon');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('should update when points input changes', async () => {
    const { fixture, el } = await setup(50);
    expect(el.querySelector('.points-badge')!.textContent).toContain('50');

    fixture.componentRef.setInput('points', 999);
    fixture.detectChanges();

    expect(el.querySelector('.points-badge')!.textContent).toContain('999');
  });
});
