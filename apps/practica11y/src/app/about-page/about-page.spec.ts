import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutPage } from './about-page';

describe('AboutPage', () => {
  let component: AboutPage;
  let fixture: ComponentFixture<AboutPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title', () => {
    const title = fixture.nativeElement.querySelector('.about-title');
    expect(title.textContent).toContain('About Practica11y');
  });

  it('should render the Credits section', () => {
    const sections = fixture.nativeElement.querySelectorAll(
      '.about-section-title',
    );
    const creditsSection = Array.from(sections).find((el) =>
      (el as HTMLElement).textContent?.includes('Credits'),
    );
    expect(creditsSection).toBeTruthy();
  });

  it('should render links to key technologies in the Credits section', () => {
    const creditsSection = fixture.nativeElement.querySelector(
      '.about-section:last-of-type',
    );
    const links = creditsSection.querySelectorAll('a[href]');
    const hrefs = Array.from(links).map((a) => (a as HTMLAnchorElement).href);

    expect(hrefs).toContain('https://angular.dev/');
    expect(hrefs).toContain('https://nx.dev/');
    expect(hrefs).toContain('https://tailwindcss.com/');
    expect(hrefs).toContain('https://vitest.dev/');
  });

  it('should render a details/summary accordion for licenses', () => {
    const details = fixture.nativeElement.querySelector(
      'details.licenses-accordion',
    );
    expect(details).toBeTruthy();

    const summary = details.querySelector('summary');
    expect(summary?.textContent).toContain('Third-Party Licenses');
  });

  describe('licenses loading via toggle', () => {
    function toggleDetails(): void {
      const details: HTMLDetailsElement = fixture.nativeElement.querySelector(
        'details.licenses-accordion',
      );
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
    }

    it('should fetch and display the licenses text when accordion is opened', async () => {
      const mockText = 'MIT License\n\nSome package license text';
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(mockText, { status: 200 }),
      );

      toggleDetails();
      await fixture.whenStable();
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('.licenses-text');
      expect(pre?.textContent).toContain('MIT License');
      expect(globalThis.fetch).toHaveBeenCalledWith('3rdpartylicenses.txt');
    });

    it('should show error message when fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 404 }),
      );

      toggleDetails();
      await fixture.whenStable();
      fixture.detectChanges();

      const errorText = fixture.nativeElement.querySelector(
        '.licenses-content .about-text',
      );
      expect(errorText?.textContent).toContain(
        'Could not load the licenses file',
      );
    });

    it('should show error message when fetch throws', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new Error('Network error'),
      );

      toggleDetails();
      await fixture.whenStable();
      fixture.detectChanges();

      const errorText = fixture.nativeElement.querySelector(
        '.licenses-content .about-text',
      );
      expect(errorText?.textContent).toContain(
        'Could not load the licenses file',
      );
    });

    it('should not fetch again if licenses are already loaded', async () => {
      const mockText = 'License text';
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(mockText, { status: 200 }),
      );

      toggleDetails();
      await fixture.whenStable();
      fixture.detectChanges();

      const fetchSpy = vi.mocked(globalThis.fetch);
      const callCountAfterFirstLoad = fetchSpy.mock.calls.length;

      // Toggle closed and open again
      const details: HTMLDetailsElement = fixture.nativeElement.querySelector(
        'details.licenses-accordion',
      );
      details.open = false;
      details.dispatchEvent(new Event('toggle'));
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fetchSpy.mock.calls.length).toBe(callCountAfterFirstLoad);
    });
  });
});
