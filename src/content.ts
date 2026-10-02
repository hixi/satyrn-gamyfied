import { content } from './generated/content';
import type { Content } from '../tools/content/schema';

/** Direct access to the generated content bundle (rebuilt by global setup). */
export function getContent(): Content {
  return content;
}
