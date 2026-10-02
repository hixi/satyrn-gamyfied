import { buildContent } from '../tools/content/build';

export default async function () {
  // Build the content bundle before the suite runs, so tests can `getContent()`.
  await buildContent({
    rootDir: 'content',
    outFile: 'src/generated/content.ts',
    strict: false,
  });
}