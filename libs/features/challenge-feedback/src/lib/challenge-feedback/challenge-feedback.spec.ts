import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ChallengeFeedback } from './challenge-feedback';
import {
  AnalysisPipelineResult,
  AccessibilityAnalysisResult,
} from '@practica11y/types';

describe('ChallengeFeedback', () => {
  let component: ChallengeFeedback;
  let componentRef: ComponentRef<ChallengeFeedback>;
  let fixture: ComponentFixture<ChallengeFeedback>;

  const emptyAnalysis: AccessibilityAnalysisResult = {
    axeResults: [],
    treeNodes: { role: 'document', children: [] },
    keyboardResults: {
      focusableElements: [],
      tabOrder: [],
      nonFocusableInteractive: [],
    },
    focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengeFeedback],
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengeFeedback);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no result is provided', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.feedback-empty')).toBeTruthy();
    expect(el.querySelector('.feedback-panel')).toBeNull();
  });

  it('should render validator results when given input', () => {
    const mockResult: AnalysisPipelineResult = {
      validationResults: [
        {
          validatorId: 'has-landmarks',
          passed: true,
          message: 'Landmark regions found',
        },
        {
          validatorId: 'heading-structure',
          passed: false,
          message: 'Heading hierarchy is incorrect',
          details: 'Skipped from h1 to h3',
        },
      ],
      accessibilityAnalysis: emptyAnalysis,
      challengeCompleted: false,
      timestamp: Date.now(),
    };

    componentRef.setInput('result', mockResult);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.validator-item');
    expect(items.length).toBe(2);

    const passedItem = el.querySelector('.validator-item.passed');
    expect(passedItem).toBeTruthy();
    expect(passedItem!.textContent).toContain('Landmark regions found');

    const failedItem = el.querySelector('.validator-item.failed');
    expect(failedItem).toBeTruthy();
    expect(failedItem!.textContent).toContain('Heading hierarchy is incorrect');
    expect(failedItem!.textContent).toContain('Skipped from h1 to h3');
  });

  it('should show success message when challenge is completed', () => {
    const mockResult: AnalysisPipelineResult = {
      validationResults: [
        { validatorId: 'test', passed: true, message: 'All good' },
      ],
      accessibilityAnalysis: emptyAnalysis,
      challengeCompleted: true,
      timestamp: Date.now(),
    };

    componentRef.setInput('result', mockResult);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const successMsg = el.querySelector('.success-message');
    expect(successMsg).toBeTruthy();
    expect(successMsg!.textContent).toContain('Challenge completed');
  });

  it('should display violations grouped by impact', () => {
    const mockResult: AnalysisPipelineResult = {
      validationResults: [],
      accessibilityAnalysis: {
        axeResults: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
            nodes: [
              {
                html: '<p>Low contrast</p>',
                target: ['p'],
                failureSummary: 'Fix contrast',
              },
            ],
          },
          {
            id: 'image-alt',
            impact: 'critical',
            description: 'Images must have alternate text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/image-alt',
            nodes: [
              {
                html: '<img src="photo.jpg">',
                target: ['img'],
                failureSummary: 'Add alt text',
              },
            ],
          },
          {
            id: 'link-name',
            impact: 'serious',
            description: 'Links must have discernible text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/link-name',
            nodes: [],
          },
        ],
        treeNodes: { role: 'document', children: [] },
        keyboardResults: {
          focusableElements: [],
          tabOrder: [],
          nonFocusableInteractive: [],
        },
        focusResults: { focusTraps: [], hiddenFocusable: [], focusOrder: [] },
      },
      challengeCompleted: false,
      timestamp: Date.now(),
    };

    componentRef.setInput('result', mockResult);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const groups = el.querySelectorAll('.violation-group');
    expect(groups.length).toBe(2); // critical and serious

    // Critical should come first
    const firstHeader = groups[0].querySelector('.violation-group-header');
    expect(firstHeader!.textContent).toContain('critical');

    const secondHeader = groups[1].querySelector('.violation-group-header');
    expect(secondHeader!.textContent).toContain('serious');

    // Serious group should have 2 violations
    const seriousViolations = groups[1].querySelectorAll('.violation-item');
    expect(seriousViolations.length).toBe(2);
  });

  describe('Validator result count matches input', () => {
    it('should render the exact number of validator items matching the input array length', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'v1', passed: true, message: 'Check 1 passed' },
          { validatorId: 'v2', passed: false, message: 'Check 2 failed' },
          { validatorId: 'v3', passed: true, message: 'Check 3 passed' },
          { validatorId: 'v4', passed: false, message: 'Check 4 failed' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const items = el.querySelectorAll('.validator-item');
      expect(items.length).toBe(4);
    });
  });

  describe('Passed validators show ✓ indicator', () => {
    it('should display ✓ for passed validators', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          {
            validatorId: 'landmarks',
            passed: true,
            message: 'Landmarks found',
          },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const passedItem = el.querySelector('.validator-item.passed');
      expect(passedItem).toBeTruthy();
      const statusIcon = passedItem!.querySelector('.validator-status');
      expect(statusIcon!.textContent).toContain('✓');
    });
  });

  describe('Failed validators show ✗ indicator and error details', () => {
    it('should display ✗ for failed validators', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'headings', passed: false, message: 'Heading issue' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const failedItem = el.querySelector('.validator-item.failed');
      expect(failedItem).toBeTruthy();
      const statusIcon = failedItem!.querySelector('.validator-status');
      expect(statusIcon!.textContent).toContain('✗');
    });
  });

  describe('Validator details shown when failed and details field present', () => {
    it('should show details text when validator fails and has details', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          {
            validatorId: 'headings',
            passed: false,
            message: 'Heading structure invalid',
            details: 'Skipped from h1 to h4',
          },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const details = el.querySelector('.validator-details');
      expect(details).toBeTruthy();
      expect(details!.textContent).toContain('Skipped from h1 to h4');
    });

    it('should not show details when validator fails without details field', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'headings', passed: false, message: 'Heading issue' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const details = el.querySelector('.validator-details');
      expect(details).toBeNull();
    });

    it('should not show details when validator passes even if details field is present', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          {
            validatorId: 'headings',
            passed: true,
            message: 'Headings OK',
            details: 'This should not appear',
          },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const details = el.querySelector('.validator-details');
      expect(details).toBeNull();
    });
  });

  describe('Violations grouped by impact in correct order', () => {
    it('should display violations in order: critical → serious → moderate → minor', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [],
        accessibilityAnalysis: {
          ...emptyAnalysis,
          axeResults: [
            {
              id: 'minor-issue',
              impact: 'minor',
              description: 'Minor issue',
              helpUrl: 'https://example.com/minor',
              nodes: [],
            },
            {
              id: 'critical-issue',
              impact: 'critical',
              description: 'Critical issue',
              helpUrl: 'https://example.com/critical',
              nodes: [],
            },
            {
              id: 'moderate-issue',
              impact: 'moderate',
              description: 'Moderate issue',
              helpUrl: 'https://example.com/moderate',
              nodes: [],
            },
            {
              id: 'serious-issue',
              impact: 'serious',
              description: 'Serious issue',
              helpUrl: 'https://example.com/serious',
              nodes: [],
            },
          ],
        },
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const groups = el.querySelectorAll('.violation-group');
      expect(groups.length).toBe(4);

      const headers = el.querySelectorAll('.violation-group-header');
      expect(headers[0].textContent).toContain('critical');
      expect(headers[1].textContent).toContain('serious');
      expect(headers[2].textContent).toContain('moderate');
      expect(headers[3].textContent).toContain('minor');
    });
  });

  describe('Violation description display', () => {
    it('should show the description for each violation', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [],
        accessibilityAnalysis: {
          ...emptyAnalysis,
          axeResults: [
            {
              id: 'image-alt',
              impact: 'critical',
              description: 'Images must have alternate text',
              helpUrl: 'https://example.com/image-alt',
              nodes: [],
            },
          ],
        },
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const description = el.querySelector('.violation-description');
      expect(description).toBeTruthy();
      expect(description!.textContent).toContain(
        'Images must have alternate text',
      );
    });
  });

  describe('Violation help link', () => {
    it('should render a help link pointing to the correct URL', () => {
      const helpUrl = 'https://dequeuniversity.com/rules/axe/image-alt';
      const mockResult: AnalysisPipelineResult = {
        validationResults: [],
        accessibilityAnalysis: {
          ...emptyAnalysis,
          axeResults: [
            {
              id: 'image-alt',
              impact: 'critical',
              description: 'Images must have alternate text',
              helpUrl,
              nodes: [],
            },
          ],
        },
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector(
        '.violation-help-link',
      ) as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.href).toBe(helpUrl);
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    });
  });

  describe('Affected HTML nodes display', () => {
    it('should show affected HTML nodes for each violation', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [],
        accessibilityAnalysis: {
          ...emptyAnalysis,
          axeResults: [
            {
              id: 'image-alt',
              impact: 'critical',
              description: 'Images must have alternate text',
              helpUrl: 'https://example.com/image-alt',
              nodes: [
                {
                  html: '<img src="photo.jpg">',
                  target: ['img'],
                  failureSummary: 'Add alt',
                },
                {
                  html: '<img src="banner.png">',
                  target: ['img.banner'],
                  failureSummary: 'Add alt',
                },
              ],
            },
          ],
        },
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const nodeHtmlElements = el.querySelectorAll('.violation-node-html');
      expect(nodeHtmlElements.length).toBe(2);
      expect(nodeHtmlElements[0].textContent).toContain(
        '<img src="photo.jpg">',
      );
      expect(nodeHtmlElements[1].textContent).toContain(
        '<img src="banner.png">',
      );
    });
  });

  describe('Success message visibility', () => {
    it('should show success message when challengeCompleted is true', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'test', passed: true, message: 'OK' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: true,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.success-message')).toBeTruthy();
    });

    it('should not show success message when challengeCompleted is false', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'test', passed: true, message: 'OK' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.success-message')).toBeNull();
    });
  });

  describe('ARIA live region for validator status updates', () => {
    it('should have an aria-live region wrapping the validator list', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'test', passed: true, message: 'OK' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const liveRegion = el.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion!.querySelector('.validator-list')).toBeTruthy();
    });
  });

  describe('Empty state when result is null', () => {
    it('should show feedback-empty and no feedback-panel when result is null', () => {
      componentRef.setInput('result', null);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.feedback-empty')).toBeTruthy();
      expect(el.querySelector('.feedback-panel')).toBeNull();
      expect(el.querySelector('.validator-item')).toBeNull();
      expect(el.querySelector('.violation-group')).toBeNull();
    });
  });

  describe('Violations section not shown when there are no violations', () => {
    it('should not render violation groups when axeResults is empty', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [
          { validatorId: 'test', passed: true, message: 'All good' },
        ],
        accessibilityAnalysis: emptyAnalysis,
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.violation-group')).toBeNull();
      expect(el.querySelector('#violations-heading')).toBeNull();
    });
  });

  describe('Multiple violations in same impact group', () => {
    it('should render all violations within the same impact group', () => {
      const mockResult: AnalysisPipelineResult = {
        validationResults: [],
        accessibilityAnalysis: {
          ...emptyAnalysis,
          axeResults: [
            {
              id: 'color-contrast',
              impact: 'serious',
              description: 'Elements must have sufficient color contrast',
              helpUrl: 'https://example.com/contrast',
              nodes: [],
            },
            {
              id: 'link-name',
              impact: 'serious',
              description: 'Links must have discernible text',
              helpUrl: 'https://example.com/link-name',
              nodes: [],
            },
            {
              id: 'button-name',
              impact: 'serious',
              description: 'Buttons must have discernible text',
              helpUrl: 'https://example.com/button-name',
              nodes: [],
            },
          ],
        },
        challengeCompleted: false,
        timestamp: Date.now(),
      };

      componentRef.setInput('result', mockResult);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const groups = el.querySelectorAll('.violation-group');
      expect(groups.length).toBe(1); // All in "serious" group

      const violations = groups[0].querySelectorAll('.violation-item');
      expect(violations.length).toBe(3);

      const descriptions = groups[0].querySelectorAll('.violation-description');
      expect(descriptions[0].textContent).toContain(
        'Elements must have sufficient color contrast',
      );
      expect(descriptions[1].textContent).toContain(
        'Links must have discernible text',
      );
      expect(descriptions[2].textContent).toContain(
        'Buttons must have discernible text',
      );
    });
  });
});
