import { render, screen, fireEvent } from '@testing-library/angular';
import { EmptyAction } from './empty-action';

describe('EmptyAction', () => {
  async function setup(options: { active?: boolean; template?: string } = {}) {
    const template =
      options.template ??
      `<a11y-empty-action [active]="active" (actionClick)="onClick()">
        <svg icon aria-hidden="true"><circle cx="12" cy="12" r="10" /></svg>
        Do something
      </a11y-empty-action>`;

    const clicked = { value: false };
    const { fixture } = await render(template, {
      imports: [EmptyAction],
      componentProperties: {
        active: options.active ?? false,
        onClick: () => {
          clicked.value = true;
        },
      },
    });

    return { fixture, clicked };
  }

  it('should render the projected button label', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /do something/i })).toBeTruthy();
  });

  it('should render the projected icon as aria-hidden', async () => {
    const { fixture } = await setup();
    const svg = fixture.nativeElement.querySelector('svg[icon]');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('should emit actionClick when the button is clicked', async () => {
    const { clicked } = await setup();
    const button = screen.getByRole('button', { name: /do something/i });
    fireEvent.click(button);
    expect(clicked.value).toBe(true);
  });

  it('should not have aria-pressed when active is false', async () => {
    await setup({ active: false });
    const button = screen.getByRole('button', { name: /do something/i });
    expect(button.getAttribute('aria-pressed')).toBeNull();
  });

  it('should set aria-pressed when active is true', async () => {
    await setup({ active: true });
    const button = screen.getByRole('button', { name: /do something/i });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('should apply active class when active is true', async () => {
    await setup({ active: true });
    const button = screen.getByRole('button', { name: /do something/i });
    expect(button.classList.contains('active')).toBe(true);
  });

  it('should not apply active class when active is false', async () => {
    await setup({ active: false });
    const button = screen.getByRole('button', { name: /do something/i });
    expect(button.classList.contains('active')).toBe(false);
  });

  it('should have button type="button"', async () => {
    await setup();
    const button = screen.getByRole('button', { name: /do something/i });
    expect(button.getAttribute('type')).toBe('button');
  });
});
