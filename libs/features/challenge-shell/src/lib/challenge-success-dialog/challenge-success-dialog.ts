import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { RouterLink } from '@angular/router';

import { Confetti } from '../confetti/confetti';

/**
 * Data passed into the challenge success dialog.
 */
export interface ChallengeSuccessDialogData {
  /** Title of the challenge that was just solved. */
  readonly challengeTitle: string;
  /** Identifier of the solved challenge. */
  readonly challengeId: string;
  /** Points awarded for solving this challenge. */
  readonly pointsAwarded: number;
  /** Current total XP after the challenge was solved. */
  readonly currentXP: number;
  /** Human-readable level label (e.g. "🌱 Hatchling"). */
  readonly levelLabel: string;
  /** Previous challenge for navigation, or null when none exists. */
  readonly previousChallenge: { id: string; title: string } | null;
  /** Next challenge for navigation, or null when none exists. */
  readonly nextChallenge: { id: string; title: string } | null;
  /** Pre-filled GitHub "new issue" URL (bug report) for this challenge. */
  readonly issueUrl: string;
  /** GitHub issue-template chooser URL, for picking a different template. */
  readonly issueChooserUrl: string;
}

/**
 * Accessible confirmation dialog shown after a challenge is solved.
 * Congratulates the user, shows the current score, offers navigation to the
 * previous/next challenge and a link to leave feedback as a GitHub issue.
 */
@Component({
  selector: 'a11y-challenge-success-dialog',
  imports: [RouterLink, Confetti],
  templateUrl: './challenge-success-dialog.html',
  styleUrl: './challenge-success-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeSuccessDialog {
  private readonly dialogRef =
    inject<DialogRef<void, ChallengeSuccessDialog>>(DialogRef);
  protected readonly data = inject<ChallengeSuccessDialogData>(DIALOG_DATA);

  /** Closes the dialog (used by navigation links and the close button). */
  protected close(): void {
    this.dialogRef.close();
  }
}
