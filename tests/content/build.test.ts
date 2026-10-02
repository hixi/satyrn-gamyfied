import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContent } from '../../tools/content/build';

describe('content build', () => {
  it('writes a typed bundle and reports dangling references', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'satyrn-')), 'content.ts');
    const r = await buildContent({ rootDir: 'tests/fixtures/content-broken/dangling', outFile: out, strict: false });
    expect(r.diagnostics.dangling.length).toBeGreaterThan(0);
    expect(readFileSync(out, 'utf8')).toContain('concept.missing');
  });
  it('strict mode refuses to write when content is broken', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'satyrn-')), 'content.ts');
    await expect(buildContent({ rootDir: 'tests/fixtures/content-broken/dangling', outFile: out, strict: true })).rejects.toThrow(/dangling/i);
  });
  it('strict mode fails clearly on an empty content root', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'satyrn-')), 'content.ts');
    await expect(buildContent({ rootDir: 'tests/fixtures/content-empty', outFile: out, strict: true })).rejects.toThrow(/empty/i);
  });
  it('strict mode refuses an unsolvable mechanic scenario', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'satyrn-')), 'content.ts');
    await expect(
      buildContent({ rootDir: 'tests/fixtures/content-broken/scenario', outFile: out, strict: true }),
    ).rejects.toThrow(/scenario problems/i);
  });
  it('lenient mode reports a scenario problem without failing', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'satyrn-')), 'content.ts');
    const r = await buildContent({ rootDir: 'tests/fixtures/content-broken/scenario', outFile: out, strict: false });
    expect(r.diagnostics.scenarioProblems).toContainEqual({
      mechanic: 'mechanic.rain-gauge',
      problem: expect.stringMatching(/unsolvable/),
    });
  });
});