import { buildContent } from './content/build';

try {
  const { diagnostics } = await buildContent({
    rootDir: 'content',
    outFile: 'src/generated/content.ts',
    strict: false,
  });
  for (const ref of diagnostics.dangling) {
    console.warn(`warning: dangling reference from ${ref.from} (${ref.field}) to ${ref.target}`);
  }
  for (const problem of diagnostics.scenarioProblems) {
    console.warn(`warning: ${problem.mechanic}: ${problem.problem}`);
  }
  console.log('content bundle written (lenient)');
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}