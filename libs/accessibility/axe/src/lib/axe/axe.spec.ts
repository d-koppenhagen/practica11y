import { vi, describe, it, expect, beforeEach } from 'vitest';
import axe from 'axe-core';
import { AxeAnalyzer } from './axe';

vi.mock('axe-core', () => ({
  default: {
    run: vi.fn(),
  },
}));

describe('AxeAnalyzer', () => {
  let analyzer: AxeAnalyzer;

  beforeEach(() => {
    analyzer = new AxeAnalyzer();
    vi.clearAllMocks();
  });

  it('should map a single axe-core violation to AxeViolation', async () => {
    vi.mocked(axe.run).mockResolvedValue({
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          nodes: [
            {
              html: '<span class="low-contrast">Hello</span>',
              target: ['.low-contrast'],
              failureSummary: 'Fix the color contrast ratio',
            },
          ],
        },
      ],
    } as unknown as Awaited<ReturnType<typeof axe.run>>);

    const result = await analyzer.run(document);

    expect(result).toEqual([
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        nodes: [
          {
            html: '<span class="low-contrast">Hello</span>',
            target: ['.low-contrast'],
            failureSummary: 'Fix the color contrast ratio',
          },
        ],
      },
    ]);
  });

  it('should return an empty array when there are no violations', async () => {
    vi.mocked(axe.run).mockResolvedValue({
      violations: [],
    } as unknown as Awaited<ReturnType<typeof axe.run>>);

    const result = await analyzer.run(document);

    expect(result).toEqual([]);
  });

  it('should map multiple violations with multiple nodes correctly', async () => {
    vi.mocked(axe.run).mockResolvedValue({
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          nodes: [
            {
              html: '<img src="photo.jpg">',
              target: ['img:nth-child(1)'],
              failureSummary: 'Element does not have an alt attribute',
            },
            {
              html: '<img src="banner.png">',
              target: ['img:nth-child(2)'],
              failureSummary: 'Element does not have an alt attribute',
            },
          ],
        },
        {
          id: 'label',
          impact: 'moderate',
          description: 'Form elements must have labels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          nodes: [
            {
              html: '<input type="text">',
              target: ['input'],
              failureSummary: 'Element has no label',
            },
          ],
        },
      ],
    } as unknown as Awaited<ReturnType<typeof axe.run>>);

    const result = await analyzer.run(document);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
      nodes: [
        {
          html: '<img src="photo.jpg">',
          target: ['img:nth-child(1)'],
          failureSummary: 'Element does not have an alt attribute',
        },
        {
          html: '<img src="banner.png">',
          target: ['img:nth-child(2)'],
          failureSummary: 'Element does not have an alt attribute',
        },
      ],
    });
    expect(result[1]).toEqual({
      id: 'label',
      impact: 'moderate',
      description: 'Form elements must have labels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
      nodes: [
        {
          html: '<input type="text">',
          target: ['input'],
          failureSummary: 'Element has no label',
        },
      ],
    });
  });

  it('should map undefined failureSummary to an empty string', async () => {
    vi.mocked(axe.run).mockResolvedValue({
      violations: [
        {
          id: 'aria-roles',
          impact: 'minor',
          description: 'ARIA roles must be valid',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-roles',
          nodes: [
            {
              html: '<div role="invalid"></div>',
              target: ['div[role="invalid"]'],
              failureSummary: undefined,
            },
          ],
        },
      ],
    } as unknown as Awaited<ReturnType<typeof axe.run>>);

    const result = await analyzer.run(document);

    expect(result[0].nodes[0].failureSummary).toBe('');
  });
});
