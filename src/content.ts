import { content, diagnostics } from './generated/content';
import type { Content, LinkDiagnostics } from '../tools/content/schema';

/** The validated content graph, generated at build time from `content/`. */
export function getContent(): Content {
  return content;
}

/** Link diagnostics for the current build (dangling references, if any). */
export function getDiagnostics(): LinkDiagnostics {
  return diagnostics;
}