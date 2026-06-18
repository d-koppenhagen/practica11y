import type { Validator, ValidationResult } from '@practica11y/models';

/**
 * Validates that all video elements have caption tracks.
 *
 * WCAG 1.2.2 requires captions for prerecorded audio content in synchronized media.
 * This checks that:
 * - Every <video> element has at least one <track> child with kind="captions"
 * - The track has required attributes: src, srclang, label
 */
export const videoHasCaptions: Validator = {
  id: 'video-has-captions',

  validate(document: Document, _context?: unknown): ValidationResult {
    const videos = Array.from(document.querySelectorAll('video'));

    if (videos.length === 0) {
      return {
        validatorId: 'video-has-captions',
        passed: true,
        message: 'No video elements found.',
      };
    }

    const issues: string[] = [];

    videos.forEach((video, index) => {
      const tracks = Array.from(video.querySelectorAll('track'));
      const captionTracks = tracks.filter(
        (track) => track.getAttribute('kind') === 'captions',
      );

      if (captionTracks.length === 0) {
        issues.push(
          `Video ${index + 1}: No <track kind="captions"> element found. Add a caption track for deaf or hard-of-hearing users.`,
        );
        return;
      }

      // Check that caption tracks have required attributes
      captionTracks.forEach((track, trackIndex) => {
        const src = track.getAttribute('src');
        const srclang = track.getAttribute('srclang');
        const label = track.getAttribute('label');

        if (!src) {
          issues.push(
            `Video ${index + 1}, Track ${trackIndex + 1}: Missing "src" attribute. The track needs a source pointing to a .vtt file.`,
          );
        }

        if (!srclang) {
          issues.push(
            `Video ${index + 1}, Track ${trackIndex + 1}: Missing "srclang" attribute. Specify the language of the captions (e.g. srclang="en").`,
          );
        }

        if (!label) {
          issues.push(
            `Video ${index + 1}, Track ${trackIndex + 1}: Missing "label" attribute. Provide a human-readable label (e.g. label="English").`,
          );
        }
      });
    });

    const passed = issues.length === 0;

    return {
      validatorId: 'video-has-captions',
      passed,
      message: passed
        ? `All ${videos.length} video(s) have proper caption tracks.`
        : `${issues.length} caption issue(s) found across ${videos.length} video(s).`,
      details: passed ? undefined : issues.join('\n'),
    };
  },
};
