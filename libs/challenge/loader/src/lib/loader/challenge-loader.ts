import { Injectable, signal, computed } from '@angular/core';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import type {
  Challenge,
  ChallengeMeta,
  StarterCode,
} from '@practica11y/models';
import { EDITOR_FILE_TYPES, emptyCodeRecord } from '@practica11y/editor-types';
import { parseFrontmatter, parseMarkdownBody } from '../frontmatter-parser';

/**
 * Registry entry representing a challenge available for loading.
 */
export interface ChallengeRegistryEntry {
  id: string;
  disabled?: boolean;
}

/**
 * Registry JSON structure listing all available challenges.
 */
export interface ChallengeRegistry {
  challenges: ChallengeRegistryEntry[];
}

const CHALLENGES_BASE_PATH = '/content/challenges';
const REGISTRY_PATH = `${CHALLENGES_BASE_PATH}/registry.json`;

/**
 * Loads and parses markdown-based challenges from static files.
 * Uses httpResource for the challenge registry and fetch for on-demand challenge loading.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeLoader {
  /**
   * Reactive resource for the challenge registry.
   * Automatically fetches the registry JSON on instantiation.
   */
  readonly registryResource: HttpResourceRef<ChallengeRegistry | undefined> =
    httpResource<ChallengeRegistry>(() => REGISTRY_PATH);

  /**
   * Computed signal providing the list of registry entries once loaded.
   */
  readonly registryEntries = computed<ChallengeRegistryEntry[]>(() => {
    const registry = this.registryResource.value();
    if (!registry || !Array.isArray(registry.challenges)) {
      return [];
    }
    return registry.challenges;
  });

  private readonly challenges = signal<Challenge[]>([]);
  readonly availableChallenges = this.challenges.asReadonly();

  /**
   * Loads all available challenges listed in the registry.
   * Disabled challenges are included as placeholders without loading their content.
   * Updates the internal challenges signal with the loaded data.
   *
   * @returns Array of all loaded Challenge objects
   * @throws Error if the registry cannot be loaded or is invalid
   */
  async loadAllChallenges(): Promise<Challenge[]> {
    const registry = await this.fetchRegistry();
    const loadedChallenges = await Promise.all(
      registry.challenges.map((entry) =>
        entry.disabled
          ? this.loadDisabledChallenge(entry.id)
          : this.loadChallenge(entry.id),
      ),
    );

    this.challenges.set(loadedChallenges);
    return loadedChallenges;
  }

  /**
   * Loads a single challenge by ID, including its starter code files.
   *
   * @param id - The unique challenge identifier
   * @returns A fully loaded Challenge object
   * @throws Error if the challenge file is missing or contains invalid data
   */
  async loadChallenge(id: string): Promise<Challenge> {
    const challengePath = `${CHALLENGES_BASE_PATH}/${id}/challenge.md`;
    const raw = await this.fetchText(challengePath);

    const meta = this.parseChallengeFile(raw, id);
    const description = parseMarkdownBody(raw);
    const starter = await this.loadStarterCode(id, meta.starter);

    const solution = meta.solution
      ? await this.loadSolutionCode(id, meta.solution)
      : undefined;

    return {
      id: meta.id,
      title: meta.title,
      difficulty: meta.difficulty,
      tags: meta.tags,
      points: meta.points,
      description,
      starter,
      validatorIds: meta.validators,
      previewTitle: meta.previewTitle ?? `Challenge: ${meta.title} | Preview`,
      links: meta.links ?? [],
      discussionUrl: meta.discussionUrl,
      solution,
    };
  }

  /**
   * Creates a placeholder Challenge for a disabled registry entry.
   * Loads only the metadata (frontmatter) without fetching starter code.
   */
  private async loadDisabledChallenge(id: string): Promise<Challenge> {
    const challengePath = `${CHALLENGES_BASE_PATH}/${id}/challenge.md`;
    const raw = await this.fetchText(challengePath);

    const meta = this.parseChallengeFile(raw, id);

    return {
      id: meta.id,
      title: meta.title,
      difficulty: meta.difficulty,
      tags: meta.tags,
      points: meta.points,
      description: '',
      starter: emptyCodeRecord(),
      validatorIds: [],
      previewTitle: meta.previewTitle ?? `Challenge: ${meta.title} | Preview`,
      links: meta.links ?? [],
      disabled: true,
      discussionUrl: meta.discussionUrl,
    };
  }

  /**
   * Fetches the challenge registry JSON file via fetch().
   */
  private async fetchRegistry(): Promise<ChallengeRegistry> {
    try {
      const response = await fetch(REGISTRY_PATH);

      if (!response.ok) {
        throw new Error(
          `Failed to load challenge registry from "${REGISTRY_PATH}": ${this.getHttpErrorMessage(response.status, response.statusText)}`,
        );
      }

      const registry = (await response.json()) as ChallengeRegistry;

      if (!registry || !Array.isArray(registry.challenges)) {
        throw new Error(
          `Invalid challenge registry: Expected an object with a "challenges" array.`,
        );
      }

      return registry;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Failed to load')
      ) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message.startsWith('Invalid challenge registry')
      ) {
        throw error;
      }
      throw new Error(
        `Failed to load challenge registry from "${REGISTRY_PATH}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Fetches a text file via fetch().
   */
  private async fetchText(path: string): Promise<string> {
    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(
          `Failed to load challenge file "${path}": ${this.getHttpErrorMessage(response.status, response.statusText)}`,
        );
      }

      return await response.text();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Failed to load')
      ) {
        throw error;
      }
      throw new Error(
        `Failed to load challenge file "${path}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Parses and validates a challenge markdown file's frontmatter.
   */
  private parseChallengeFile(raw: string, challengeId: string): ChallengeMeta {
    try {
      return parseFrontmatter(raw);
    } catch (error) {
      throw new Error(
        `Failed to parse challenge "${challengeId}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Loads solution code files for a challenge.
   * Follows the same pattern as loadStarterCode but all file types are optional.
   *
   * @param challengeId - The unique challenge identifier
   * @param solution - The solution file path mapping from frontmatter
   * @returns A StarterCode object with loaded content (empty strings for unspecified types)
   * @throws Error if any referenced solution file fails to load
   */
  async loadSolutionCode(
    challengeId: string,
    solution: ChallengeMeta['solution'],
  ): Promise<StarterCode> {
    const basePath = `${CHALLENGES_BASE_PATH}/${challengeId}`;
    const result = emptyCodeRecord();

    for (const fileType of EDITOR_FILE_TYPES) {
      const filePath = solution?.[fileType.id];
      if (filePath) {
        const fullPath = `${basePath}/${filePath}`;
        try {
          result[fileType.id] = await this.fetchText(fullPath);
        } catch (error) {
          throw new Error(
            `Failed to load solution ${fileType.label} for challenge "${challengeId}": ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      }
    }

    return result;
  }

  /**
   * Loads starter code files (all supported file types) for a challenge.
   */
  private async loadStarterCode(
    challengeId: string,
    starter: ChallengeMeta['starter'],
  ): Promise<StarterCode> {
    const basePath = `${CHALLENGES_BASE_PATH}/${challengeId}`;
    const result = emptyCodeRecord();

    for (const fileType of EDITOR_FILE_TYPES) {
      const filePath = starter[fileType.id as keyof typeof starter];
      if (filePath) {
        const fullPath = `${basePath}/${filePath}`;
        try {
          result[fileType.id] = await this.fetchText(fullPath);
        } catch (error) {
          throw new Error(
            `Failed to load starter ${fileType.label} for challenge "${challengeId}": ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      }
    }

    return result;
  }

  /**
   * Extracts a human-readable message from an HTTP error status.
   */
  private getHttpErrorMessage(status: number, statusText: string): string {
    if (status === 404) {
      return 'File not found (404)';
    }
    return `HTTP ${status} ${statusText}`;
  }
}
