import { SCENARIO_VALIDATORS } from '../../src/mechanics/scenarios';
import type { Content, ScenarioProblem } from './schema';

/**
 * Validate every authored mechanic's `params` against its scenario validator.
 * A mechanic that carries params but registers no validator is itself a problem,
 * so a new world cannot quietly ship an unchecked scenario.
 */
export function validateScenarios(content: Content): ScenarioProblem[] {
  const problems: ScenarioProblem[] = [];
  for (const [id, mechanic] of Object.entries(content.mechanics)) {
    const hasParams = Object.keys(mechanic.params).length > 0;
    const validator = SCENARIO_VALIDATORS[id];
    if (!validator) {
      if (hasParams) problems.push({ mechanic: id, problem: 'has params but no scenario validator' });
      continue;
    }
    for (const problem of validator(mechanic.params)) problems.push({ mechanic: id, problem });
  }
  return problems;
}