import { test as base, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

export interface ChallengeInfo {
  id: string;
  solution: Record<string, string>; // tab → filename mapping from frontmatter
}

export type EditorTab = 'html' | 'css' | 'js' | 'vtt';

export interface ChallengeHelpers {
  navigateToChallenge(id: string): Promise<void>;
  setEditorContent(tab: EditorTab, content: string): Promise<void>;
  clickCheckSolution(): Promise<void>;
  getScore(): Promise<number>;
  hasValidationErrors(): Promise<boolean>;
  readSolutionFile(challengeId: string, filename: string): string;
}

interface RegistryEntry {
  id: string;
}

interface Registry {
  challenges: RegistryEntry[];
}

const CHALLENGES_DIR = path.resolve(
  __dirname,
  '../../../../apps/practica11y/public/content/challenges',
);

/**
 * Reads the challenge registry and parses each challenge's frontmatter
 * to extract the solution field mapping.
 */
export function getRegisteredChallenges(): ChallengeInfo[] {
  const registryPath = path.join(CHALLENGES_DIR, 'registry.json');
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  const registry: Registry = JSON.parse(registryContent);

  return registry.challenges.map((entry) => {
    const challengeMdPath = path.join(CHALLENGES_DIR, entry.id, 'challenge.md');
    const solution = parseSolutionFromFrontmatter(challengeMdPath);
    return { id: entry.id, solution };
  });
}

/**
 * Custom Playwright test fixture that provides challenge page helpers.
 * These helpers encapsulate common interactions with the challenge UI:
 * navigating, editing code, submitting solutions, and reading results.
 */
export const test = base.extend<{ challengeHelpers: ChallengeHelpers }>({
  challengeHelpers: async ({ page, context }, use) => {
    // Grant clipboard permissions for paste operations in Monaco editor
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const helpers: ChallengeHelpers = {
      async navigateToChallenge(id: string): Promise<void> {
        await page.goto(`/challenges/${id}`);
        // Wait for the challenge page to be ready (Monaco editor visible)
        await page.waitForSelector('.monaco-editor', { timeout: 30_000 });
      },

      async setEditorContent(tab: EditorTab, content: string): Promise<void> {
        // Map tab names to Monaco language IDs
        const languageMap: Record<EditorTab, string> = {
          html: 'html',
          css: 'css',
          js: 'javascript',
          vtt: 'plaintext',
        };
        const language = languageMap[tab];

        // Check if the tab exists in the editor
        const tabExists = await page
          .getByRole('tab', { name: new RegExp(`^${tab}$`, 'i') })
          .count()
          .then((c) => c > 0);

        if (tabExists) {
          // 1. Click the tab to activate it (triggers @defer loading)
          await page
            .getByRole('tab', { name: new RegExp(`^${tab}$`, 'i') })
            .click();

          // 2. Wait for the Monaco editor to load inside that panel
          await page.waitForSelector(
            `[id="editor-panel-${tab}"] .monaco-editor`,
            { timeout: 15_000 },
          );

          // 3. Use Monaco API to set the model value directly by language
          //    and also sync the Angular component's content signal + pipeline
          await page.evaluate(
            ({ lang, text, tabName }) => {
              const models = (window as any).monaco?.editor?.getModels();
              const model = models?.find(
                (m: any) => m.getLanguageId() === lang,
              );
              if (model) {
                model.setValue(text);
              }
              // Also set the Angular signal to ensure the pipeline is synced
              const shellEl = document.querySelector('a11y-challenge-shell');
              const component = (window as any).ng?.getComponent(shellEl);
              if (component) {
                const signalName = `${tabName}Content`;
                if (typeof component[signalName]?.set === 'function') {
                  component[signalName].set(text);
                }
                component.pipeline?.updateCode(
                  component.htmlContent(),
                  component.jsContent(),
                  component.cssContent(),
                );
              }
            },
            { lang: language, text: content, tabName: tab },
          );
        } else {
          // Tab doesn't exist (e.g., JS tab not shown because starter has no JS).
          // Use Angular component API to set the content signal directly.
          await page.evaluate(
            ({ tabName, text }) => {
              const shellEl = document.querySelector('a11y-challenge-shell');
              const component = (window as any).ng?.getComponent(shellEl);
              if (!component) return;

              const signalName = `${tabName}Content`;
              if (typeof component[signalName]?.set === 'function') {
                component[signalName].set(text);
              }
              // Trigger pipeline update so the preview/validation sees new code
              component.pipeline?.updateCode(
                component.htmlContent(),
                component.jsContent(),
                component.cssContent(),
              );
            },
            { tabName: tab, text: content },
          );
        }

        // Small delay to let Angular process the change
        await page.waitForTimeout(500);
      },

      async clickCheckSolution(): Promise<void> {
        // Ensure the preview iframe is loaded (it uses @defer on viewport).
        // Scroll the preview into view and wait for the iframe to appear.
        const previewPanel = page.locator('a11y-preview-panel');
        await previewPanel.scrollIntoViewIfNeeded();
        const iframe = page.locator(
          'a11y-preview-panel iframe[title="Live Preview"]',
        );
        await iframe.waitFor({ state: 'attached', timeout: 30_000 });

        // Wait for the sandbox script inside the iframe to be ready.
        // The sandbox posts 'dom-ready' on load — we verify by checking
        // that the iframe's contentDocument has the user-content element.
        await page.waitForFunction(
          () => {
            const iframeEl = document.querySelector(
              'a11y-preview-panel iframe[title="Live Preview"]',
            ) as HTMLIFrameElement | null;
            if (!iframeEl) return false;
            try {
              return !!iframeEl.contentDocument?.getElementById('user-content');
            } catch {
              return false;
            }
          },
          { timeout: 30_000 },
        );

        // Click the "Check Solution" button
        const checkButton = page.getByRole('button', {
          name: 'Check Solution',
        });
        await checkButton.click();

        // Wait for validation to complete: feedback results must appear
        await page.waitForSelector('.feedback-results', {
          timeout: 90_000,
        });
      },

      async getScore(): Promise<number> {
        // The score is displayed as "{number} XP" with aria-label="Experience points"
        const xpElement = page.locator('[aria-label="Experience points"]');
        const text = await xpElement.textContent();
        const match = text?.match(/(\d+)\s*XP/);
        return match ? parseInt(match[1], 10) : 0;
      },

      async hasValidationErrors(): Promise<boolean> {
        // Check if there are any failed validator items in the feedback results
        const failedItems = page.locator('.validator-item.failed');
        const count = await failedItems.count();
        return count > 0;
      },

      readSolutionFile(challengeId: string, filename: string): string {
        const filePath = path.join(CHALLENGES_DIR, challengeId, filename);
        return fs.readFileSync(filePath, 'utf-8');
      },
    };

    await use(helpers);
  },
});

export { expect };

/**
 * Reads a solution file for a given challenge from its content directory.
 * Exported standalone for use outside the fixture context (e.g., at test-generation time).
 */
export function readSolutionFile(
  challengeId: string,
  filename: string,
): string {
  const filePath = path.join(CHALLENGES_DIR, challengeId, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parses YAML frontmatter from a challenge.md file and extracts
 * the `solution` field (a Record<string, string>).
 */
function parseSolutionFromFrontmatter(
  filePath: string,
): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    return {};
  }

  const parsed = yaml.parse(frontmatter);
  if (!parsed || typeof parsed.solution !== 'object' || !parsed.solution) {
    return {};
  }

  return parsed.solution as Record<string, string>;
}

/**
 * Extracts the YAML frontmatter string between --- delimiters.
 */
function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}
