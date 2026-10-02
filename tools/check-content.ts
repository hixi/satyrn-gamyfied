import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContent } from './content/build';

const COMMITTED = 'src/generated/content.ts';

try {
  // Build to a temp file, so a stale committed bundle is detected rather than
  // silently overwritten. `npm run build:content` regenerates the committed one.
  const out = join(mkdtempSync(join(tmpdir(), 'satyrn-check-')), 'content.ts');
  await buildContent({ rootDir: 'content', outFile: out, strict: true });
  const fresh = readFileSync(out, 'utf8');

  if (!existsSync(COMMITTED) || readFileSync(COMMITTED, 'utf8') !== fresh) {
    console.error(
      `${COMMITTED} is stale or missing. Run \`npm run build:content\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log('content OK');
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}