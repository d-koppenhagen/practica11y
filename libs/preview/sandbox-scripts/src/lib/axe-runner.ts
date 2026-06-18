declare const axe: {
  run(context: Document | Element): Promise<{
    violations: Array<{
      id: string;
      impact: string;
      description: string;
      helpUrl: string;
      nodes: Array<{
        html: string;
        target: string[];
        failureSummary?: string;
      }>;
    }>;
  }>;
};

import type { AxeViolationPayload } from './messaging';

export async function runAxeAnalysis(): Promise<AxeViolationPayload[]> {
  const userContent = document.getElementById('user-content');
  if (!userContent) return [];

  const results = await axe.run(userContent);
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => ({
      html: n.html,
      target: n.target as string[],
      failureSummary: n.failureSummary || '',
    })),
  }));
}
