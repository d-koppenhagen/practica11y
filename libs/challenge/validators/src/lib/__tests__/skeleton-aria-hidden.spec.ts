import { describe, it, expect } from 'vitest';
import { skeletonAriaHidden } from '../skeleton-aria-hidden';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('skeletonAriaHidden', () => {
  it('passes when skeleton cards have aria-hidden, container has aria-busy, and a live region exists', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container" aria-busy="true">
          <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-image">Loading</div>
            <div class="skeleton-title">Loading</div>
          </div>
          <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-image">Loading</div>
            <div class="skeleton-title">Loading</div>
          </div>
        </div>
        <p role="status">Loading articles, please wait.</p>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('fails when skeleton cards are missing aria-hidden', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container" aria-busy="true">
          <div class="skeleton-card">
            <div class="skeleton-image">Loading</div>
          </div>
        </div>
        <p role="status">Loading articles, please wait.</p>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('aria-hidden="true"');
  });

  it('fails when container is missing aria-busy', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container">
          <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-image">Loading</div>
          </div>
        </div>
        <p role="status">Loading articles, please wait.</p>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('aria-busy="true"');
  });

  it('fails when no live region is present', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container" aria-busy="true">
          <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-image">Loading</div>
          </div>
        </div>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.details).toContain('live region');
  });

  it('passes when no skeleton elements are found', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container">
          <div class="card">
            <h3>Article Title</h3>
            <p>Real content here.</p>
          </div>
        </div>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('accepts aria-live="polite" as a valid live region', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container" aria-busy="true">
          <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-image">Loading</div>
          </div>
        </div>
        <div aria-live="polite">Loading content...</div>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('detects aria-busy on an ancestor up to 3 levels above', async () => {
    const doc = createDoc(`
      <section aria-busy="true">
        <div class="wrapper">
          <div class="cards-container">
            <div class="skeleton-card" aria-hidden="true">
              <div class="skeleton-image">Loading</div>
            </div>
          </div>
        </div>
        <p role="status">Loading...</p>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('reports multiple issues when all checks fail', async () => {
    const doc = createDoc(`
      <section>
        <div class="cards-container">
          <div class="skeleton-card">
            <div class="skeleton-image">Loading</div>
          </div>
        </div>
      </section>
    `);
    const result = await skeletonAriaHidden.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('3 issue(s)');
  });
});
