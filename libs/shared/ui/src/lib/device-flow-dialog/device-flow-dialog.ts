import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

/**
 * Data passed into the Device Flow dialog.
 */
export interface DeviceFlowDialogData {
  readonly userCode: string;
  readonly verificationUri: string;
  readonly isPolling: boolean;
  readonly errorMessage: string | null;
}

/**
 * Modal dialog displayed during the GitHub OAuth Device Flow.
 * Shows the user code, a link to the verification URL, copy button,
 * polling status, and a cancel button.
 *
 * Opened imperatively via CDK Dialog — same pattern as ChallengeSuccessDialog.
 */
@Component({
  selector: 'a11y-device-flow-dialog',
  templateUrl: './device-flow-dialog.html',
  styleUrl: './device-flow-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceFlowDialog {
  private readonly dialogRef =
    inject<DialogRef<'cancel' | undefined, DeviceFlowDialog>>(DialogRef);
  protected readonly data = inject<DeviceFlowDialogData>(DIALOG_DATA);

  protected readonly copySuccess = signal(false);

  protected async copyCode(): Promise<void> {
    const code = this.data.userCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch {
      this.fallbackCopy(code);
    }
  }

  protected cancel(): void {
    this.dialogRef.close('cancel');
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.copySuccess.set(true);
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
