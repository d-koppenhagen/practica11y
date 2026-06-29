import { render, screen, fireEvent } from '@testing-library/angular';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  RevealConfirmDialog,
  RevealConfirmDialogData,
} from './reveal-confirm-dialog';

describe('RevealConfirmDialog', () => {
  const mockDialogData: RevealConfirmDialogData = {
    challengeTitle: 'Alt Text Basics',
  };

  function createMockDialogRef() {
    return { close: vi.fn() };
  }

  async function setup(dialogRef = createMockDialogRef()) {
    const { fixture } = await render(RevealConfirmDialog, {
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: mockDialogData },
      ],
    });
    return { fixture, dialogRef };
  }

  it('should render with an encouraging message and both buttons', async () => {
    await setup();

    expect(
      screen.getByText(/no judgment — peeking is learning too/i),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /yes, show me/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });

  it('should close the dialog with true when "Yes, show me" is clicked', async () => {
    const { dialogRef } = await setup();

    const confirmButton = screen.getByRole('button', { name: /yes, show me/i });
    fireEvent.click(confirmButton);

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close the dialog with false when "Cancel" is clicked', async () => {
    const { dialogRef } = await setup();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should have the correct ARIA attributes for an accessible dialog', async () => {
    const { fixture } = await setup();

    // The dialog title should have the correct id for aria-labelledby
    const titleElement = fixture.nativeElement.querySelector(
      '#reveal-confirm-title',
    );
    expect(titleElement).not.toBeNull();
    expect(titleElement.tagName.toLowerCase()).toBe('h2');
    expect(titleElement.textContent).toContain(
      'No judgment — peeking is learning too!',
    );
  });

  it('should display the challenge title in the body text', async () => {
    await setup();

    expect(screen.getByText(/Alt Text Basics/)).toBeTruthy();
  });
});
