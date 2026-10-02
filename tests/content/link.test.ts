import { describe, it, expect } from 'vitest';
import { loadRawContent } from '../../tools/content/load';
import { validateContent } from '../../tools/content/validate';
import { linkContent, checkContent } from '../../tools/content/link';

const load = (dir: string) => validateContent(loadRawContent('tests/fixtures/' + dir));

describe('link checker', () => {
  it('reports a dangling reference with its source and field', () => {
    const d = linkContent(load('content-broken/dangling'));
    expect(d.dangling).toContainEqual({ from: 'world.x', field: 'concepts', target: 'concept.missing' });
  });
  it('passes the minimal fixture', () => {
    expect(() => checkContent(load('content-min'))).not.toThrow();
  });
  it('rejects a concept reference cycle', () => {
    expect(() => checkContent(load('content-broken/cycle'))).toThrow(/cycle/i);
  });
  it('rejects a world absent from every thread', () => {
    expect(() => checkContent(load('content-broken/unreachable'))).toThrow(/unreachable/i);
  });
});