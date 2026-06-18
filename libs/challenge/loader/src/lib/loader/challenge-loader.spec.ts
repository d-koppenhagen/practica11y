import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChallengeLoader } from './challenge-loader';

const VALID_CHALLENGE_MD = `---
id: clickable-div
title: Clickable Div
difficulty: beginner
tags:
  - semantics
  - keyboard
points: 100
starter:
  html: starter.html
  css: starter.css
validators:
  - semantic-button
  - keyboard-accessible
---

# Challenge Description

Fix the clickable div to be accessible.`;

const VALID_REGISTRY = {
  challenges: [{ id: 'clickable-div' }, { id: 'form-labels' }],
};

describe('ChallengeLoader', () => {
  let loader: ChallengeLoader;
  let mockFetch: ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), ChallengeLoader],
    });
    loader = TestBed.inject(ChallengeLoader);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadChallenge', () => {
    it('should load a known challenge and return a complete Challenge object', async () => {
      // Mock: challenge.md fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => VALID_CHALLENGE_MD,
      });
      // Mock: starter.html fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '<div onclick="doStuff()">Click me</div>',
      });
      // Mock: starter.css fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '.clickable { cursor: pointer; }',
      });

      const challenge = await loader.loadChallenge('clickable-div');

      expect(challenge.id).toBe('clickable-div');
      expect(challenge.title).toBe('Clickable Div');
      expect(challenge.difficulty).toBe('beginner');
      expect(challenge.tags).toEqual(['semantics', 'keyboard']);
      expect(challenge.points).toBe(100);
      expect(challenge.description).toBe(
        '# Challenge Description\n\nFix the clickable div to be accessible.',
      );
      expect(challenge.starter.html).toBe(
        '<div onclick="doStuff()">Click me</div>',
      );
      expect(challenge.starter.css).toBe('.clickable { cursor: pointer; }');
      expect(challenge.validatorIds).toEqual([
        'semantic-button',
        'keyboard-accessible',
      ]);
    });

    it('should throw a specific error when the challenge file is not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.loadChallenge('non-existent')).rejects.toThrow(
        /Failed to load challenge file.*non-existent.*404/,
      );
    });

    it('should throw a descriptive error when the challenge file contains invalid YAML', async () => {
      const invalidYaml = `---
id: bad-challenge
title: [invalid yaml{{
---

Body`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => invalidYaml,
      });

      await expect(loader.loadChallenge('bad-challenge')).rejects.toThrow(
        /Failed to parse challenge "bad-challenge"/,
      );
    });
  });

  describe('loadAllChallenges', () => {
    it('should load all challenges and return the correct number with correct IDs', async () => {
      const formLabelsMd = `---
id: form-labels
title: Form Labels
difficulty: intermediate
tags:
  - forms
points: 75
starter:
  html: starter.html
validators:
  - label-association
---

# Form Labels

Add proper labels to form inputs.`;

      // Use URL-based mock to handle parallel fetches from Promise.all
      mockFetch.mockImplementation(async (url: string) => {
        if (url.endsWith('registry.json')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => VALID_REGISTRY,
          };
        }
        if (url.includes('clickable-div/challenge.md')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => VALID_CHALLENGE_MD,
          };
        }
        if (url.includes('clickable-div/starter.html')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => '<div>starter html</div>',
          };
        }
        if (url.includes('clickable-div/starter.css')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => '.style {}',
          };
        }
        if (url.includes('form-labels/challenge.md')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => formLabelsMd,
          };
        }
        if (url.includes('form-labels/starter.html')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => '<form><input type="text"></form>',
          };
        }
        return { ok: false, status: 404, statusText: 'Not Found' };
      });

      const challenges = await loader.loadAllChallenges();

      expect(challenges).toHaveLength(2);
      expect(challenges[0].id).toBe('clickable-div');
      expect(challenges[1].id).toBe('form-labels');
    });

    it('should throw an error when the registry file is not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.loadAllChallenges()).rejects.toThrow(
        /Failed to load challenge registry.*404/,
      );
    });

    it('should throw an error when the registry has an invalid format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ invalid: 'structure' }),
      });

      await expect(loader.loadAllChallenges()).rejects.toThrow(
        /Invalid challenge registry/,
      );
    });
  });
});
