import { Injectable } from '@angular/core';
import axe, { Result, NodeResult } from 'axe-core';
import { AxeViolation, AxeViolationNode } from '@practica11y/types';

@Injectable({ providedIn: 'root' })
export class AxeAnalyzer {
  async run(document: Document): Promise<AxeViolation[]> {
    // Run axe scoped to the iframe's body content only.
    // Using the body element as context ensures axe doesn't scan
    // the parent page (Monaco editor, etc.)
    const context = document.body ?? document.documentElement;
    const results = await axe.run(context, {
      iframes: false, // Don't recurse into nested iframes
    });
    return results.violations.map(this.mapToAxeViolation);
  }

  private mapToAxeViolation(violation: Result): AxeViolation {
    return {
      id: violation.id,
      impact: violation.impact as AxeViolation['impact'],
      description: violation.description,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(
        (node: NodeResult): AxeViolationNode => ({
          html: node.html,
          target: node.target as string[],
          failureSummary: node.failureSummary ?? '',
        }),
      ),
    };
  }
}
