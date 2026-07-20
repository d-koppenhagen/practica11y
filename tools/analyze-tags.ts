/**
 * Analyze challenge tags across all challenges.
 *
 * Reads every challenge.md frontmatter, extracts tags, and outputs a summary
 * of tag usage (count + which challenges use each tag).
 *
 * Usage:
 *   npx tsx tools/analyze-tags.ts [--json]
 *
 * Flags:
 *   --json   Output machine-readable JSON instead of human-readable text
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const CHALLENGES_DIR = resolve(
  import.meta.dirname,
  '../apps/practica11y/public/content/challenges',
);

interface TagInfo {
  tag: string;
  count: number;
  challenges: string[];
}

interface AnalysisResult {
  totalChallenges: number;
  totalTags: number;
  tags: TagInfo[];
}

function extractFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return parseYaml(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function analyzeTags(): AnalysisResult {
  const tagMap = new Map<string, string[]>();

  const entries = readdirSync(CHALLENGES_DIR, { withFileTypes: true });
  let challengeCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const challengeFile = join(CHALLENGES_DIR, entry.name, 'challenge.md');
    if (!existsSync(challengeFile)) continue;

    const content = readFileSync(challengeFile, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) continue;

    challengeCount++;

    const tags = frontmatter['tags'];
    if (!Array.isArray(tags)) continue;

    for (const tag of tags) {
      const tagStr = String(tag).toLowerCase();
      const existing = tagMap.get(tagStr) ?? [];
      existing.push(entry.name);
      tagMap.set(tagStr, existing);
    }
  }

  const sortedTags: TagInfo[] = [...tagMap.entries()]
    .map(([tag, challenges]) => ({
      tag,
      count: challenges.length,
      challenges: challenges.sort(),
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    totalChallenges: challengeCount,
    totalTags: sortedTags.length,
    tags: sortedTags,
  };
}

function printText(result: AnalysisResult): void {
  console.log('=== Challenge Tag Analysis ===\n');
  console.log(`Total challenges: ${result.totalChallenges}`);
  console.log(`Unique tags: ${result.totalTags}\n`);
  console.log('Tag usage (sorted by frequency):\n');

  const maxTagLen = Math.max(...result.tags.map((t) => t.tag.length));

  for (const { tag, count, challenges } of result.tags) {
    const paddedTag = tag.padEnd(maxTagLen);
    console.log(
      `  ${paddedTag}  ${String(count).padStart(2)}×  [${challenges.join(', ')}]`,
    );
  }

  console.log('\n--- Existing tags (copy-paste list) ---\n');
  console.log(result.tags.map((t) => t.tag).join(', '));
}

function printJson(result: AnalysisResult): void {
  console.log(JSON.stringify(result, null, 2));
}

// --- Main ---
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const result = analyzeTags();

if (jsonMode) {
  printJson(result);
} else {
  printText(result);
}
