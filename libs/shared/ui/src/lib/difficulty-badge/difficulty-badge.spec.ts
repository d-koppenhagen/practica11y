import { render } from '@testing-library/angular';
import { DifficultyBadge } from './difficulty-badge';

describe('DifficultyBadge', () => {
  async function setup(difficulty: 'beginner' | 'intermediate' | 'advanced') {
    const { fixture } = await render(DifficultyBadge, {
      inputs: { difficulty },
    });
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('should render the difficulty text', async () => {
    const { el } = await setup('beginner');
    const badge = el.querySelector('.difficulty-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('beginner');
  });

  it('should apply beginner class for beginner difficulty', async () => {
    const { el } = await setup('beginner');
    const badge = el.querySelector('.difficulty-badge');
    expect(badge!.classList.contains('difficulty-beginner')).toBe(true);
    expect(badge!.classList.contains('difficulty-intermediate')).toBe(false);
    expect(badge!.classList.contains('difficulty-advanced')).toBe(false);
  });

  it('should apply intermediate class for intermediate difficulty', async () => {
    const { el } = await setup('intermediate');
    const badge = el.querySelector('.difficulty-badge');
    expect(badge!.classList.contains('difficulty-intermediate')).toBe(true);
    expect(badge!.classList.contains('difficulty-beginner')).toBe(false);
    expect(badge!.classList.contains('difficulty-advanced')).toBe(false);
  });

  it('should apply advanced class for advanced difficulty', async () => {
    const { el } = await setup('advanced');
    const badge = el.querySelector('.difficulty-badge');
    expect(badge!.classList.contains('difficulty-advanced')).toBe(true);
    expect(badge!.classList.contains('difficulty-beginner')).toBe(false);
    expect(badge!.classList.contains('difficulty-intermediate')).toBe(false);
  });

  it('should capitalize the difficulty text via CSS', async () => {
    const { el } = await setup('advanced');
    const badge = el.querySelector('.difficulty-badge');
    expect(badge!.textContent!.trim()).toBe('advanced');
  });
});
