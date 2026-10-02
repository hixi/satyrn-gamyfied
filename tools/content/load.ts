import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { RawContent } from './schema';

const BUCKETS = [
  'concepts',
  'characters',
  'worlds',
  'mechanics',
  'achievements',
  'dialogues',
  'threads',
  'strings',
] as const;

export class ContentLoadError extends Error {}

/** Read every `*.yaml` part under each bucket of `rootDir`, keyed by id. */
export function loadRawContent(rootDir: string): RawContent {
  const out = {} as RawContent;
  for (const bucket of BUCKETS) {
    const dir = join(rootDir, bucket);
    const record: Record<string, unknown> = {};
    if (existsSync(dir)) {
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
        .sort();
      for (const file of files) {
        const path = join(dir, file);
        let parsed: unknown;
        try {
          parsed = parse(readFileSync(path, 'utf8'));
        } catch (e) {
          throw new ContentLoadError(`${path}: malformed YAML: ${(e as Error).message}`);
        }
        if (!parsed || typeof parsed !== 'object' || typeof (parsed as { id?: unknown }).id !== 'string') {
          throw new ContentLoadError(`${path}: missing a string id`);
        }
        const partId = (parsed as { id: string }).id;
        if (partId in record) {
          throw new ContentLoadError(`duplicate id ${partId} in ${path}`);
        }
        record[partId] = parsed;
      }
    }
    out[bucket] = record;
  }
  return out;
}