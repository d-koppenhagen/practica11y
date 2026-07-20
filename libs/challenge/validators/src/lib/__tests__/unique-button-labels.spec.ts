import { describe, it, expect } from 'vitest';
import { uniqueButtonLabels } from '../unique-button-labels';

function createDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('uniqueButtonLabels', () => {
  it('passes when all buttons have unique accessible names', () => {
    const doc = createDoc(`
      <button aria-label="Edit Alice's profile">Edit</button>
      <button aria-label="Edit Bob's profile">Edit</button>
      <button aria-label="Delete Alice's profile">Delete</button>
      <button aria-label="Delete Bob's profile">Delete</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
    expect(result.message).toBe('All buttons have unique accessible names.');
  });

  it('fails when multiple buttons share the same text content', () => {
    const doc = createDoc(`
      <button>Edit</button>
      <button>Edit</button>
      <button>Delete</button>
      <button>Delete</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('2 group(s)');
    expect(result.details).toContain(
      '2 buttons share the accessible name "edit"',
    );
    expect(result.details).toContain(
      '2 buttons share the accessible name "delete"',
    );
  });

  it('passes when a single button exists (no duplicates possible)', () => {
    const doc = createDoc(`<button>Submit</button>`);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('passes when no buttons exist', () => {
    const doc = createDoc(`<p>No buttons here</p>`);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('uses aria-label for name comparison', () => {
    const doc = createDoc(`
      <button aria-label="Edit Alice">Edit</button>
      <button aria-label="Edit Bob">Edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('uses aria-labelledby for name comparison', () => {
    const doc = createDoc(`
      <h2 id="name-alice">Alice</h2>
      <button aria-labelledby="name-alice">Edit</button>
      <h2 id="name-bob">Bob</h2>
      <button aria-labelledby="name-bob">Edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('fails when aria-labelledby resolves to the same name', () => {
    const doc = createDoc(`
      <span id="label1">Edit</span>
      <span id="label2">Edit</span>
      <button aria-labelledby="label1">Edit</button>
      <button aria-labelledby="label2">Edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(false);
  });

  it('treats comparison as case-insensitive', () => {
    const doc = createDoc(`
      <button>Edit</button>
      <button>edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(false);
  });

  it('includes visually hidden text in the accessible name', () => {
    const doc = createDoc(`
      <button>Edit <span class="sr-only">Alice's profile</span></button>
      <button>Edit <span class="sr-only">Bob's profile</span></button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('excludes aria-hidden content from the accessible name', () => {
    const doc = createDoc(`
      <button><span aria-hidden="true">🖊️</span> Edit</button>
      <button><span aria-hidden="true">🖊️</span> Edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(false);
  });

  it('skips buttons with empty names (handled by interactive-element-name)', () => {
    const doc = createDoc(`
      <button></button>
      <button></button>
      <button>Save</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });

  it('uses title attribute as accessible name', () => {
    const doc = createDoc(`
      <button title="Edit Alice">Edit</button>
      <button title="Edit Bob">Edit</button>
    `);
    const result = uniqueButtonLabels.validate(doc);
    expect(result.passed).toBe(true);
  });
});
