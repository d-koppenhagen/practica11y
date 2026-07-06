import { describe, it, expect, afterEach } from 'vitest';
import { sortableTableAria } from '../sortable-table-aria';

describe('sortable-table-aria', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should have id "sortable-table-aria"', () => {
    expect(sortableTableAria.id).toBe('sortable-table-aria');
  });

  describe('valid sortable table → pass', () => {
    it('should pass with caption, aria-sort, buttons, and sort announcer', () => {
      document.body.innerHTML = `
        <table>
          <caption>Team members</caption>
          <thead>
            <tr>
              <th aria-sort="ascending" data-sort="name"><button type="button">Name</button></th>
              <th aria-sort="none" data-sort="role"><button type="button">Role</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td><td>Developer</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" aria-atomic="true" class="sr-only" id="sort-announcer"></div>
        <div aria-live="polite" aria-atomic="true" class="status">Showing 1 of 1</div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(true);
    });

    it('should pass with aria-label on table instead of caption', () => {
      document.body.innerHTML = `
        <table aria-label="Team members">
          <thead>
            <tr>
              <th aria-sort="none"><button type="button">Name</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="sr-only"></div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(true);
    });
  });

  describe('missing table → fail', () => {
    it('should fail when no table element exists', () => {
      document.body.innerHTML = `
        <div class="table">
          <div class="row header">
            <div class="cell">Name</div>
          </div>
        </div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No semantic table');
    });
  });

  describe('missing caption or aria-label → fail', () => {
    it('should fail when table has no caption or aria-label', () => {
      document.body.innerHTML = `
        <table>
          <thead>
            <tr>
              <th aria-sort="none"><button type="button">Name</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="sr-only"></div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('caption');
    });
  });

  describe('missing aria-sort → fail', () => {
    it('should fail when no headers have aria-sort', () => {
      document.body.innerHTML = `
        <table aria-label="Team">
          <thead>
            <tr>
              <th><button type="button">Name</button></th>
              <th><button type="button">Role</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td><td>Developer</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="sr-only"></div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('aria-sort');
    });
  });

  describe('invalid aria-sort value → fail', () => {
    it('should fail with invalid aria-sort value', () => {
      document.body.innerHTML = `
        <table aria-label="Team">
          <thead>
            <tr>
              <th aria-sort="up"><button type="button">Name</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="sr-only"></div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Invalid aria-sort value');
    });
  });

  describe('missing buttons in headers → fail', () => {
    it('should fail when sortable headers have no buttons', () => {
      document.body.innerHTML = `
        <table aria-label="Team">
          <thead>
            <tr>
              <th aria-sort="none">Name</th>
              <th aria-sort="none">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td><td>Developer</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="sr-only"></div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('button');
    });
  });

  describe('missing sort announcer live region → fail', () => {
    it('should fail when no visually hidden live region exists', () => {
      document.body.innerHTML = `
        <label for="filter">Filter</label>
        <input type="text" id="filter" />
        <table>
          <caption>Team</caption>
          <thead>
            <tr>
              <th aria-sort="none"><button type="button">Name</button></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td></tr>
          </tbody>
        </table>
        <div aria-live="polite" class="status">Showing 1 of 1</div>
      `;

      const result = sortableTableAria.validate(document);

      expect(result.passed).toBe(false);
      expect(result.details).toContain('visually hidden live region');
    });
  });
});
