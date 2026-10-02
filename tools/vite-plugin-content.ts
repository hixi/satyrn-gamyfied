import type { Plugin } from 'vite';
import { buildContent } from './content/build';

const OPTS = { rootDir: 'content', outFile: 'src/generated/content.ts', strict: false };

function isContentPath(path: string): boolean {
  const normalized = path.split(/[\\/]/);
  return normalized.includes('content');
}

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
      const onChange = (path: string) => {
        if (isContentPath(path)) void rebuild();
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}