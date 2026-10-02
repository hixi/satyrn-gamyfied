import type { ZodType } from 'zod';
import {
  AchievementSchema,
  CharacterSchema,
  ConceptSchema,
  DialogueSchema,
  MechanicSchema,
  StringsSchema,
  ThreadSchema,
  WorldSchema,
  type Content,
  type RawContent,
} from './schema';

export class ContentValidationError extends Error {}

function parseBucket<T>(
  bucket: string,
  schema: ZodType<T>,
  record: Record<string, unknown>,
): Record<string, T> {
  const out: Record<string, T> = {};
  const problems: string[] = [];
  for (const [partId, value] of Object.entries(record)) {
    const result = schema.safeParse(value);
    if (result.success) {
      out[partId] = result.data;
    } else {
      for (const issue of result.error.issues) {
        problems.push(`${partId}: ${issue.path.join('.')}: ${issue.message}`);
      }
    }
  }
  if (problems.length) {
    throw new ContentValidationError(`${bucket} invalid:\n  ${problems.join('\n  ')}`);
  }
  return out;
}

/** Validate each bucket, collecting every problem rather than stopping at the first. */
export function validateContent(raw: RawContent): Content {
  return {
    concepts: parseBucket('concepts', ConceptSchema, raw.concepts),
    characters: parseBucket('characters', CharacterSchema, raw.characters),
    worlds: parseBucket('worlds', WorldSchema, raw.worlds),
    mechanics: parseBucket('mechanics', MechanicSchema, raw.mechanics),
    achievements: parseBucket('achievements', AchievementSchema, raw.achievements),
    dialogues: parseBucket('dialogues', DialogueSchema, raw.dialogues),
    threads: parseBucket('threads', ThreadSchema, raw.threads),
    strings: parseBucket('strings', StringsSchema, raw.strings),
  };
}