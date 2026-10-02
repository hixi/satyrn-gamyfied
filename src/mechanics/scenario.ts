/**
 * Shared helpers for mechanic scenario validation. Deliberately free of any DOM
 * or Lit dependency, so the build tooling can import a mechanic's scenario
 * module in Node and validate authored content without defining a custom element.
 */
export type ScenarioProblems = string[];

/** A scenario validator: returns problems with the authored params; empty is valid. */
export type ScenarioValidator = (params: unknown) => ScenarioProblems;

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

/** Ids that appear more than once, in order of first repeat. */
export function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const id of ids) {
    if (seen.has(id) && !dupes.includes(id)) dupes.push(id);
    seen.add(id);
  }
  return dupes;
}

/** Ids from a list of `{ id }` records. */
export function idsOf(items: { id: string }[]): string[] {
  return items.map((item) => item.id);
}