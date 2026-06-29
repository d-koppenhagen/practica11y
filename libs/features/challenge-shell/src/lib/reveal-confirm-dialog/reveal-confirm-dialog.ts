import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

/**
 * Data passed into the reveal confirm dialog.
 */
export interface RevealConfirmDialogData {
  /** Title of the challenge the user wants to peek at. */
  readonly challengeTitle: string;
}

/**
 * Accessible confirmation dialog shown before revealing a challenge solution.
 * Uses an encouraging, non-judgmental tone. Confirm closes with `true`,
 * cancel closes with `false`.
 */
@Component({
  selector: 'a11y-reveal-confirm-dialog',
  imports: [],
  templateUrl: './reveal-confirm-dialog.html',
  styleUrl: './reveal-confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevealConfirmDialog {
  private readonly dialogRef =
    inject<DialogRef<boolean, RevealConfirmDialog>>(DialogRef);
  protected readonly data = inject<RevealConfirmDialogData>(DIALOG_DATA);

  /** Confirms the reveal action. Closes dialog with `true`. */
  protected confirm(): void {
    this.dialogRef.close(true);
  }

  /** Cancels the reveal action. Closes dialog with `false`. */
  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
