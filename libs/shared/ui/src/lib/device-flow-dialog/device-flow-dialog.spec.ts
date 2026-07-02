import { render, fireEvent } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DeviceFlowDialog, DeviceFlowDialogData } from './device-flow-dialog';

describe('DeviceFlowDialog', () => {
  const defaultData: DeviceFlowDialogData = {
    userCode: 'ABCD-1234',
    verificationUri: 'https://github.com/login/device',
    isPolling: true,
    errorMessage: null,
  };

  async function setup(data: Partial<DeviceFlowDialogData> = {}) {
    const dialogRef = { close: vi.fn() } as unknown as DialogRef<
      'cancel' | undefined
    >;

    const { fixture } = await render(DeviceFlowDialog, {
      providers: [
        { provide: DIALOG_DATA, useValue: { ...defaultData, ...data } },
        { provide: DialogRef, useValue: dialogRef },
      ],
    });

    return { fixture, dialogRef };
  }

  describe('display', () => {
    it('should display the user code', async () => {
      const { fixture } = await setup({ userCode: 'WXYZ-5678' });

      const codeEl = fixture.nativeElement.querySelector('.user-code');
      expect(codeEl.textContent).toContain('WXYZ-5678');
    });

    it('should display the verification link', async () => {
      const { fixture } = await setup();

      const link = fixture.nativeElement.querySelector('.verification-link');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('https://github.com/login/device');
    });

    it('should show polling status when isPolling is true', async () => {
      const { fixture } = await setup({ isPolling: true, errorMessage: null });

      const polling = fixture.nativeElement.querySelector('.status-polling');
      expect(polling).not.toBeNull();
      expect(polling.textContent).toContain('Waiting for authorization');
    });

    it('should show error message when present', async () => {
      const { fixture } = await setup({ errorMessage: 'Something went wrong' });

      const error = fixture.nativeElement.querySelector('.status-error');
      expect(error).not.toBeNull();
      expect(error.textContent).toContain('Something went wrong');
    });
  });

  describe('copy button', () => {
    it('should copy the user code to the clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const { fixture } = await setup({ userCode: 'COPY-ME99' });

      const copyButton = fixture.nativeElement.querySelector('.copy-button');
      fireEvent.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith('COPY-ME99');
    });
  });

  describe('cancel', () => {
    it('should close the dialog with "cancel" when cancel button is clicked', async () => {
      const { fixture, dialogRef } = await setup();

      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');
      fireEvent.click(cancelButton);

      expect(dialogRef.close).toHaveBeenCalledWith('cancel');
    });

    it('should close the dialog with "cancel" when close (X) button is clicked', async () => {
      const { fixture, dialogRef } = await setup();

      const closeButton = fixture.nativeElement.querySelector('.close-button');
      fireEvent.click(closeButton);

      expect(dialogRef.close).toHaveBeenCalledWith('cancel');
    });
  });

  describe('ARIA', () => {
    it('should have a dialog title with correct id', async () => {
      const { fixture } = await setup();

      const titleEl = fixture.nativeElement.querySelector(
        '#device-flow-dialog-title',
      );
      expect(titleEl).not.toBeNull();
      expect(titleEl.textContent).toContain('Sign in with GitHub');
    });
  });
});
