import type { Plugin } from 'vite';
import { buildContent } from './content/build';

const OPTS = { rootDir: 'content', outFile: 'src/generated/content.ts', strict: false };

/** Build the content bundle at startup and rebuild it when `content/` changes. */
export function contentPlugin(): Plugin {
  return {
    name: 'satyrn-content',
    async buildStart() {
      await buildContent(OPTS);
    },
    configureServer(server) {
      server.watcher.add('content');
      const rebuild = async () => {
        try {
          await buildContent(OPTS);
          server.ws.send({ type: 'full-reload' });
        } catch (error) {
          console.error((error as Error).message);
        }
      };
      server.watcher.on('change', (path) => {
        if (path.includes('/content/')) void rebuild();
      });
      server.watcher.on('add', (path) => {
        if (path.includes('/content/')) void rebuild();
      });
      server.watcher.on('unlink', (path) => {
        if (path.includes('/content/')) void rebuild();
      });
    },
  };
}