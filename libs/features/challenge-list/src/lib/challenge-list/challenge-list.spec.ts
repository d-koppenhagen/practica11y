import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChallengeList } from './challenge-list';
import { Challenge } from '@practica11y/models';

const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: 'Clickable Div',
    difficulty: 'beginner',
    tags: ['semantics', 'keyboard'],
    points: 100,
    description: 'Fix the clickable div',
    starter: { html: '<div>Click me</div>', js: '', css: '', vtt: '' },
    validatorIds: ['semantic-button'],
    previewTitle: 'Challenge: Clickable Div | Preview',
    links: [],
  },
  {
    id: 'challenge-2',
    title: 'Focus Trap',
    difficulty: 'intermediate',
    tags: ['keyboard', 'focus'],
    points: 200,
    description: 'Implement focus trap',
    starter: { html: '<div>Modal</div>', js: '', css: '', vtt: '' },
    validatorIds: ['focus-trap'],
    previewTitle: 'Challenge: Focus Trap | Preview',
    links: [],
  },
  {
    id: 'challenge-3',
    title: 'Color Contrast',
    difficulty: 'advanced',
    tags: ['contrast'],
    points: 300,
    description: 'Fix contrast issues',
    starter: { html: '<p>Low contrast text</p>', js: '', css: '', vtt: '' },
    validatorIds: ['color-contrast'],
    previewTitle: 'Challenge: Color Contrast | Preview',
    links: [],
  },
];

describe('ChallengeList', () => {
  let component: ChallengeList;
  let fixture: ComponentFixture<ChallengeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengeList],
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render challenges when given input', () => {
    fixture.componentRef.setInput('challenges', mockChallenges);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.challenge-button');
    expect(buttons.length).toBe(3);
  });

  it('should display challenge titles', () => {
    fixture.componentRef.setInput('challenges', mockChallenges);
    fixture.detectChanges();

    const titles = fixture.nativeElement.querySelectorAll('.challenge-title');
    expect(titles[0].textContent).toContain('Clickable Div');
    expect(titles[1].textContent).toContain('Focus Trap');
    expect(titles[2].textContent).toContain('Color Contrast');
  });

  it('should show completion status for completed challenges', () => {
    fixture.componentRef.setInput('challenges', mockChallenges);
    fixture.componentRef.setInput('completedChallengeIds', ['challenge-1']);
    fixture.detectChanges();

    const completed = fixture.nativeElement.querySelectorAll(
      '.completion-status.completed',
    );
    expect(completed.length).toBe(1);
  });

  describe('rendering challenges with title, difficulty, tags and status', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', ['challenge-1']);
      fixture.detectChanges();
    });

    it('should render correct difficulty badge classes', () => {
      const badges =
        fixture.nativeElement.querySelectorAll('.difficulty-badge');
      expect(badges[0].classList.contains('difficulty-beginner')).toBe(true);
      expect(badges[1].classList.contains('difficulty-intermediate')).toBe(
        true,
      );
      expect(badges[2].classList.contains('difficulty-advanced')).toBe(true);
    });

    it('should render tags as tag-badges', () => {
      const items = fixture.nativeElement.querySelectorAll('.challenge-button');

      const tagsFirst = items[0].querySelectorAll('.tag-badge');
      expect(tagsFirst.length).toBe(2);
      expect(tagsFirst[0].textContent).toContain('semantics');
      expect(tagsFirst[1].textContent).toContain('keyboard');

      const tagsSecond = items[1].querySelectorAll('.tag-badge');
      expect(tagsSecond.length).toBe(2);
      expect(tagsSecond[0].textContent).toContain('keyboard');
      expect(tagsSecond[1].textContent).toContain('focus');

      const tagsThird = items[2].querySelectorAll('.tag-badge');
      expect(tagsThird.length).toBe(1);
      expect(tagsThird[0].textContent).toContain('contrast');
    });

    it('should display points for each challenge', () => {
      const points =
        fixture.nativeElement.querySelectorAll('.challenge-points');
      expect(points[0].textContent).toContain('100');
      expect(points[1].textContent).toContain('200');
      expect(points[2].textContent).toContain('300');
    });

    it('should show completed status only for completed challenges', () => {
      const completed = fixture.nativeElement.querySelectorAll(
        '.completion-status.completed',
      );
      const pending = fixture.nativeElement.querySelectorAll(
        '.completion-status.pending',
      );
      expect(completed.length).toBe(1);
      expect(pending.length).toBe(2);
    });
  });

  describe('difficulty filter', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();
    });

    function setDifficultyFilter(value: string): void {
      const select: HTMLSelectElement =
        fixture.nativeElement.querySelector('#difficulty-filter');
      select.value = value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    it('should show only beginner challenges when filtered by beginner', () => {
      setDifficultyFilter('beginner');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Clickable Div');
    });

    it('should show only intermediate challenges when filtered by intermediate', () => {
      setDifficultyFilter('intermediate');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Focus Trap');
    });

    it('should show only advanced challenges when filtered by advanced', () => {
      setDifficultyFilter('advanced');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Color Contrast');
    });

    it('should show all challenges when filter is set to all', () => {
      setDifficultyFilter('beginner');
      fixture.detectChanges();

      setDifficultyFilter('all');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(3);
    });
  });

  describe('tag filter', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();
    });

    function setTagFilter(value: string): void {
      const select: HTMLSelectElement =
        fixture.nativeElement.querySelector('#tag-filter');
      select.value = value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    it('should show challenges with keyboard tag (2 matches)', () => {
      setTagFilter('keyboard');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(2);

      const titles = Array.from(
        fixture.nativeElement.querySelectorAll(
          '.challenge-title',
        ) as NodeListOf<HTMLElement>,
      ).map((el) => el.textContent?.trim());
      expect(titles).toContain('Clickable Div');
      expect(titles).toContain('Focus Trap');
    });

    it('should show only advanced challenge when filtered by contrast (1 match)', () => {
      setTagFilter('contrast');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Color Contrast');
    });

    it('should show only intermediate challenge when filtered by focus (1 match)', () => {
      setTagFilter('focus');

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Focus Trap');
    });
  });

  describe('combined filters', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();
    });

    it('should show only challenge-1 with difficulty=beginner and tag=keyboard', () => {
      const difficultySelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('#difficulty-filter');
      difficultySelect.value = 'beginner';
      difficultySelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const tagSelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('#tag-filter');
      tagSelect.value = 'keyboard';
      tagSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      expect(buttons.length).toBe(1);
      expect(
        buttons[0].querySelector('.challenge-title').textContent,
      ).toContain('Clickable Div');
    });
  });

  describe('challenge selection', () => {
    it('should emit challengeSelected with correct ID when a challenge is clicked', () => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();

      let emittedId: string | undefined;
      component.challengeSelected.subscribe((id: string) => {
        emittedId = id;
      });

      const buttons =
        fixture.nativeElement.querySelectorAll('.challenge-button');
      buttons[1].click();

      expect(emittedId).toBe('challenge-2');
    });
  });

  describe('empty state', () => {
    it('should show empty state when no challenges match the filter', () => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();

      // Set difficulty to beginner, then filter by a tag not on beginner challenges
      const difficultySelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('#difficulty-filter');
      difficultySelect.value = 'advanced';
      difficultySelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const tagSelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('#tag-filter');
      tagSelect.value = 'keyboard';
      tagSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No challenges found');
    });

    it('should show empty state when challenges input is empty', () => {
      fixture.componentRef.setInput('challenges', []);
      fixture.componentRef.setInput('completedChallengeIds', []);
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('available tags computation', () => {
    it('should compute unique sorted tags from input challenges', () => {
      fixture.componentRef.setInput('challenges', mockChallenges);
      fixture.detectChanges();

      const tagSelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('#tag-filter');
      const options = Array.from(tagSelect.options).map((o) => o.value);

      // First option is 'all', then sorted unique tags
      expect(options).toEqual([
        'all',
        'contrast',
        'focus',
        'keyboard',
        'semantics',
      ]);
    });
  });
});
