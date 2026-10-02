import { describe, it, expect } from 'vitest';
import { loadRawContent } from '../../tools/content/load';
import { validateContent } from '../../tools/content/validate';

const ROOT = 'tests/fixtures/content-min';

describe('content loader', () => {
  it('loads every part keyed by id', () => {
    const raw = loadRawContent(ROOT);
    expect(Object.keys(raw.worlds)).toEqual(['world.lantern-room']);
    expect((raw.concepts['concept.tokens'] as { term: string }).term).toBe('Token');
  });
  it('validates into a typed Content', () => {
    const content = validateContent(loadRawContent(ROOT));
    expect(content.mechanics['mechanic.lantern'].title).toBe('The Lantern');
  });
  it('throws ContentLoadError on a duplicate id', () => {
    expect(() => loadRawContent('tests/fixtures/content-broken/duplicate')).toThrow(/duplicate/i);
  });
  it('throws ContentValidationError naming the field', () => {
    expect(() => validateContent(loadRawContent('tests/fixtures/content-broken/invalid')))
      .toThrow(/order/i);
  });
});