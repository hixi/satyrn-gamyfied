import { duplicates, idsOf, isRecord, type ScenarioProblems } from '../scenario';

export interface Seed {
  id: string;
  name: string;
}

export interface CommunityBead {
  id: string;
  name: string;
  keeper: string;
  about: string;
}

export const MAX_NAME_LENGTH = 60;

const DEFAULT_SEEDS: Seed[] = [
  { id: 'seed-attention', name: 'Attention' },
  { id: 'seed-evidence', name: 'Evidence' },
  { id: 'seed-constraint', name: 'Constraint' },
  { id: 'seed-tending', name: 'Tending' },
];
const DEFAULT_BEADS: CommunityBead[] = [
  { id: 'fog-alphabet', name: 'The Fog Alphabet', keeper: 'a lighthouse keeper', about: 'A Bead about lighting one thing at a time.' },
  { id: 'long-ledger', name: 'The Long Ledger', keeper: 'a bookkeeper', about: 'A Bead about counting what a small model spends.' },
  { id: 'second-lantern', name: 'The Second Lantern', keeper: 'a night watch', about: 'A Bead about keeping a spare check ready.' },
];

export function parseScenario(params: unknown): { seeds: Seed[]; communityBeads: CommunityBead[] } {
  const raw = (params ?? {}) as { seeds?: unknown; communityBeads?: unknown };
  const seeds = Array.isArray(raw.seeds)
    ? raw.seeds
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s, i) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `seed-${i}`,
          name: typeof s.name === 'string' && s.name ? s.name : `seed ${i + 1}`,
        }))
    : [];
  const communityBeads = Array.isArray(raw.communityBeads)
    ? raw.communityBeads
        .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
        .map((b, i) => ({
          id: typeof b.id === 'string' && b.id ? b.id : `bead-${i}`,
          name: typeof b.name === 'string' && b.name ? b.name : `Bead ${i + 1}`,
          keeper: typeof b.keeper === 'string' && b.keeper ? b.keeper : 'someone',
          about: typeof b.about === 'string' && b.about ? b.about : '',
        }))
    : [];
  return {
    seeds: seeds.length ? seeds : DEFAULT_SEEDS,
    communityBeads: communityBeads.length ? communityBeads : DEFAULT_BEADS,
  };
}

export function validateScenario(params: unknown): ScenarioProblems {
  const problems: ScenarioProblems = [];
  if (params !== undefined && params !== null && !isRecord(params)) {
    return ['params must be a mapping'];
  }
  const raw = isRecord(params) ? params : {};
  if (raw.seeds !== undefined && !Array.isArray(raw.seeds)) problems.push('seeds must be a list');
  if (raw.communityBeads !== undefined && !Array.isArray(raw.communityBeads)) {
    problems.push('communityBeads must be a list');
  }

  const { seeds, communityBeads } = parseScenario(params);
  for (const id of duplicates(idsOf(seeds))) problems.push(`duplicate seed id: ${id}`);
  for (const id of duplicates(idsOf(communityBeads))) problems.push(`duplicate community Bead id: ${id}`);

  // An empty authored list is a real problem, even though the parser falls back
  // to the defaults so the mechanic still renders.
  const seedCount = Array.isArray(raw.seeds) ? raw.seeds.length : seeds.length;
  const beadCount = Array.isArray(raw.communityBeads) ? raw.communityBeads.length : communityBeads.length;
  if (seedCount === 0) problems.push('unsolvable: no seeds to plant');
  if (beadCount === 0) problems.push('unsolvable: no community Beads to wander');
  return problems;
}