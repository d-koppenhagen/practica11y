import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Subscription } from 'rxjs';

import { CheatAnimation } from '../cheat-animation/cheat-animation';
import {
  RevealConfirmDialog,
  RevealConfirmDialogData,
} from '../reveal-confirm-dialog/reveal-confirm-dialog';

/**
 * Action buttons for reveal solution, reset to starter, and back to user code.
 * Placed in the editor panel header alongside the language tabs.
 */
@Component({
  selector: 'a11y-editor-actions',
  imports: [CheatAnimation],
  templateUrl: './editor-actions.html',
  styleUrl: './editor-actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorActions {
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  private dialogSubscription: Subscription | null = null;

  /** Whether the current challenge has a solution available */
  readonly hasSolution = input(false);

  /** Whether the solution is currently revealed */
  readonly solutionRevealed = input(false);

  /** Whether the user has a saved code snapshot to restore */
  readonly hasUserSnapshot = input(false);

  /** Whether this challenge was previously peeked */
  readonly isPeeked = input(false);

  /** Challenge title for the confirmation dialog */
  readonly challengeTitle = input('');

  /** Emits when user confirms reveal (after dialog confirmation) */
  readonly revealSolution = output<void>();

  /** Emits when user clicks "Reset to Starter" */
  readonly resetToStarter = output<void>();

  /** Emits when user clicks "Back to My Code" */
  readonly restoreUserCode = output<void>();

  /** Controls the cheat animation trigger */
  protected readonly animationTrigger = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.dialogSubscription?.unsubscribe();
    });
  }

  protected onRevealSolution(): void {
    const dialogRef = this.dialog.open<boolean, RevealConfirmDialogData>(
      RevealConfirmDialog,
      {
        data: { challengeTitle: this.challengeTitle() },
        ariaModal: true,
        autoFocus: 'dialog',
        restoreFocus: true,
      },
    );

    this.dialogSubscription?.unsubscribe();
    this.dialogSubscription = dialogRef.closed.subscribe((confirmed) => {
      if (confirmed === true) {
        this.animationTrigger.set(true);
        this.revealSolution.emit();
      }
    });
  }

  protected onAnimationComplete(): void {
    this.animationTrigger.set(false);
  }

  protected onResetToStarter(): void {
    this.resetToStarter.emit();
  }

  protected onRestoreUserCode(): void {
    this.restoreUserCode.emit();
  }
}
