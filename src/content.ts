import { content, diagnostics } from './generated/content';
import type { Content, ContentDiagnostics } from '../tools/content/schema';

/** The validated content graph, generated at build time from `content/`. */
export function getContent(): Content {
  return content;
}

/** Everything the build reported about the content (dangling refs, bad scenarios). */
export function getDiagnostics(): ContentDiagnostics {
  return diagnostics;
}