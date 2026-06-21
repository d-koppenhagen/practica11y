import { Virtual } from '@guidepup/virtual-screen-reader';

/** Phrase emitted by the Virtual Screen Reader once it reaches the document end. */
const END_OF_DOCUMENT = 'end of document';

/**
 * Upper bound on navigation steps to guard against pathological documents that
 * never emit the `end of document` phrase (e.g. live regions mutating the DOM).
 */
const MAX_STEPS = 5000;

/** A single screen reader stop: what is announced and the node it sits on. */
export interface SpokenStep {
  /** The phrase the screen reader announces at this cursor position. */
  phrase: string;
  /**
   * The DOM node the reading cursor rested on for this phrase, or `null` when
   * the position has no associated node (e.g. structural boundary phrases).
   * Used to highlight the announced element in the preview during playback.
   */
  node: Node | null;
}

/**
 * Runs the Guidepup Virtual Screen Reader across the given container and
 * collects an ordered log of every stop — the spoken phrase plus the DOM node
 * the reading cursor rested on. This mirrors what a real screen reader user
 * would hear (and where their cursor would be) when traversing the content
 * top to bottom.
 *
 * The node references are captured so the player can highlight the announced
 * element during playback, independent of Guidepup's own lifecycle (its
 * built-in cursor only exists for the duration of this traversal).
 *
 * @param container The root node to announce, typically the preview's `body`.
 * @param contentWindow The window the container belongs to. Required when the
 *   container lives in a different document than the global `window` (e.g. an
 *   iframe), so accessible name and visibility computations use the right APIs.
 * @returns The ordered list of spoken steps.
 */
export async function generateSpokenSteps(
  container: Node,
  contentWindow?: Window | null,
): Promise<SpokenStep[]> {
  const virtual = new Virtual();

  await virtual.start({
    container,
    ...(contentWindow ? { window: contentWindow } : {}),
  });

  try {
    const steps: SpokenStep[] = [];
    let phrase = await virtual.lastSpokenPhrase();

    // The reader always announces the document root first; an empty phrase here
    // means there is genuinely nothing to read (e.g. an empty container).
    if (!phrase) {
      return [];
    }

    steps.push({ phrase, node: virtual.activeNode });

    let count = 0;
    while (phrase !== END_OF_DOCUMENT && count < MAX_STEPS) {
      await virtual.next();
      phrase = await virtual.lastSpokenPhrase();
      steps.push({ phrase, node: virtual.activeNode });
      count++;
    }

    return steps;
  } finally {
    await virtual.stop();
  }
}

/**
 * Convenience wrapper that returns only the spoken phrases, discarding the node
 * references. Useful where the DOM mapping is not needed.
 */
export async function generateSpokenPhrases(
  container: Node,
  contentWindow?: Window | null,
): Promise<string[]> {
  const steps = await generateSpokenSteps(container, contentWindow);
  return steps.map((step) => step.phrase);
}
