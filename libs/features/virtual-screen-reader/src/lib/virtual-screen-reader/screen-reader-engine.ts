import { Virtual } from '@guidepup/virtual-screen-reader';

/** Phrase emitted by the Virtual Screen Reader once it reaches the document end. */
const END_OF_DOCUMENT = 'end of document';

/**
 * Upper bound on navigation steps to guard against pathological documents that
 * never emit the `end of document` phrase (e.g. live regions mutating the DOM).
 */
const MAX_STEPS = 5000;

/**
 * Runs the Guidepup Virtual Screen Reader across the given container and
 * collects the full log of spoken phrases — the same announcements a real
 * screen reader user would hear when traversing the content top to bottom.
 *
 * @param container The root node to announce, typically the preview's `body`.
 * @param contentWindow The window the container belongs to. Required when the
 *   container lives in a different document than the global `window` (e.g. an
 *   iframe), so accessible name and visibility computations use the right APIs.
 * @returns The ordered list of spoken phrases.
 */
export async function generateSpokenPhrases(
  container: Node,
  contentWindow?: Window | null,
): Promise<string[]> {
  const virtual = new Virtual();

  await virtual.start({
    container,
    // displayCursor: true,
    ...(contentWindow ? { window: contentWindow } : {}),
  });

  try {
    let steps = 0;
    while (
      (await virtual.lastSpokenPhrase()) !== END_OF_DOCUMENT &&
      steps < MAX_STEPS
    ) {
      await virtual.next();
      steps++;
    }

    return await virtual.spokenPhraseLog();
  } finally {
    await virtual.stop();
  }
}
