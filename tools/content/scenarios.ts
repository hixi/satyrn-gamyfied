import { SCENARIO_VALIDATORS } from '../../src/game/worlds/scenarios';
import type { Content, ScenarioProblem } from './schema';

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