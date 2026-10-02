import { buildContent } from './content/build';

try {
  await buildContent({
    rootDir: 'content',
    outFile: 'src/generated/content.ts',
    strict: true,
  });
  console.log('content OK');
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}