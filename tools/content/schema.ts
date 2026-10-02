import { z } from 'zod';

const id = (ns: string) =>
  z.string().regex(new RegExp('^' + ns + '\\.[a-z0-9-]+$'), `must be ${ns}.<slug>`);

export type Condition =
  | { event: 'mechanic.completed'; mechanic?: string; world?: string }
  | { event: 'world.entered'; world?: string }
  | { event: 'world.skipped'; world?: string }
  | { event: 'world.engineRoom.completed'; world?: string }
  | { event: 'evidence.submitted'; mechanic?: string }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({
      event: z.literal('mechanic.completed'),
      mechanic: z.string().optional(),
      world: z.string().optional(),
    }),
    z.object({ event: z.literal('world.entered'), world: z.string().optional() }),
    z.object({ event: z.literal('world.skipped'), world: z.string().optional() }),
    z.object({ event: z.literal('world.engineRoom.completed'), world: z.string().optional() }),
    z.object({ event: z.literal('evidence.submitted'), mechanic: z.string().optional() }),
    z.object({ all: z.array(ConditionSchema) }),
    z.object({ any: z.array(ConditionSchema) }),
    z.object({ not: ConditionSchema }),
  ]),
);

export const ConceptSchema = z.object({
  id: id('concept'),
  term: z.string().min(1),
  short: z.string().min(1),
  body: z.string().min(1),
  related: z.array(id('concept')).default([]),
});

export const CharacterSchema = z.object({
  id: id('character'),
  name: z.string().min(1),
  title: z.string().optional(),
  description: z.string().min(1),
});

export const MechanicSchema = z.object({
  id: id('mechanic'),
  element: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  a11y: z.string().min(1),
  params: z.record(z.unknown()).default({}),
});

export const EngineRoomSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  mechanic: id('mechanic').optional(),
});

export const WorldSchema = z.object({
  id: id('world'),
  title: z.string().min(1),
  act: z.enum(['prologue', 'act1', 'act2', 'act3']),
  order: z.number().int(),
  keeper: id('character').optional(),
  concepts: z.array(id('concept')).default([]),
  mechanic: id('mechanic'),
  summary: z.string().min(1),
  intro: z.string().min(1),
  engineRoom: EngineRoomSchema.optional(),
});

export const AchievementSchema = z
  .object({
    id: id('achievement'),
    title: z.string().min(1),
    description: z.string().min(1),
    kind: z.enum(['lesson', 'skip', 'depth', 'journey']),
    condition: ConditionSchema.optional(),
    predicate: z.string().min(1).optional(),
  })
  .refine((a) => (a.condition ? !a.predicate : !!a.predicate), {
    message: 'exactly one of condition or predicate is required',
  });

export const DialogueChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  next: z.string().min(1).optional(),
  condition: ConditionSchema.optional(),
});
export type DialogueChoice = z.infer<typeof DialogueChoiceSchema>;

export const DialogueNodeSchema = z.object({
  id: z.string().min(1),
  speaker: id('character'),
  text: z.string().min(1),
  choices: z.array(DialogueChoiceSchema).default([]),
});

export const DialogueSchema = z.object({
  id: z.string().regex(/^dialogue\.[a-z0-9.-]+$/, 'must be dialogue.<slug>'),
  start: z.string().min(1),
  nodes: z.record(DialogueNodeSchema),
});

export const ThreadSchema = z.object({
  id: id('thread'),
  title: z.string().min(1),
  sequence: z.array(id('world')),
});

export const StringsSchema = z.object({
  id: id('strings'),
  title: z.string().min(1),
  values: z.record(z.string()).default({}),
});

export type Concept = z.infer<typeof ConceptSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Mechanic = z.infer<typeof MechanicSchema>;
export type World = z.infer<typeof WorldSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type Dialogue = z.infer<typeof DialogueSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type Strings = z.infer<typeof StringsSchema>;

/** Authored source, before validation: each bucket keyed by id. */
export interface RawContent {
  concepts: Record<string, unknown>;
  characters: Record<string, unknown>;
  worlds: Record<string, unknown>;
  mechanics: Record<string, unknown>;
  achievements: Record<string, unknown>;
  dialogues: Record<string, unknown>;
  threads: Record<string, unknown>;
  strings: Record<string, unknown>;
}

/** Validated content: each bucket keyed by id. */
export interface Content {
  concepts: Record<string, Concept>;
  characters: Record<string, Character>;
  worlds: Record<string, World>;
  mechanics: Record<string, Mechanic>;
  achievements: Record<string, Achievement>;
  dialogues: Record<string, Dialogue>;
  threads: Record<string, Thread>;
  strings: Record<string, Strings>;
}

export interface DanglingRef {
  from: string;
  field: string;
  target: string;
}

/** A problem with an authored mechanic scenario, found at build time. */
export interface ScenarioProblem {
  mechanic: string;
  problem: string;
}

/** Everything the content build can report about the authored content. */
export interface ContentDiagnostics {
  dangling: DanglingRef[];
  scenarioProblems: ScenarioProblem[];
}