/**
 * Shared helpers for mechanic scenario validation. Deliberately free of any DOM
 * or Lit dependency, so the build tooling can import a mechanic's scenario
 * module in Node and validate authored content without defining a custom element.
 */
export type ScenarioProblems = string[];

export type ScenarioValidator = (params: unknown) => ScenarioProblems;

export interface StarBands {
  three: number;
  two: number;
}

/** Read and type-check the shared `stars` thresholds from mechanic params. */
export function parseStars(params: unknown): StarBands | undefined {
  if (!isRecord(params)) return undefined;
  const stars = params.stars;
  if (!isRecord(stars)) return undefined;
  const { three, two } = stars as Record<string, unknown>;
  if (!Number.isInteger(three) || !Number.isInteger(two)) return undefined;
  return { three: three as number, two: two as number };
}

/** Shape and order problems for the shared `stars` thresholds. */
export function validateStarsParam(params: unknown, opts?: { required?: boolean }): ScenarioProblems {
  const problems: ScenarioProblems = [];
  const required = opts?.required ?? true;
  const stars = isRecord(params) ? params.stars : undefined;
  if (stars === undefined) {
    if (required) problems.push('missing stars thresholds');
    return problems;
  }
  const parsed = parseStars(params);
  if (!parsed || parsed.three < 0 || parsed.two < 0 || parsed.three > parsed.two) {
    problems.push('stars must be { three, two } non-negative integers with three <= two');
  }
  return problems;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isPositiveInt(value: unknown): value is number {
  return isPositiveNumber(value) && Number.isInteger(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string');
}

export function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const id of ids) {
    if (seen.has(id) && !dupes.includes(id)) dupes.push(id);
    seen.add(id);
  }
  return dupes;
}

export function idsOf(items: { id: string }[]): string[] {
  return items.map((item) => item.id);
}