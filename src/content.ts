import { content, diagnostics } from './generated/content';
import type { Content, ContentDiagnostics } from '../tools/content/schema';

export function getContent(): Content {
  return content;
}

export function getDiagnostics(): ContentDiagnostics {
  return diagnostics;
}