import type { ScenarioValidator } from './scenario';
import { validateScenario as rainGauge } from './rain-gauge/scenario';
import { validateScenario as aviary } from './aviary/scenario';
import { validateScenario as cartwright } from './cartwright/scenario';
import { validateScenario as roundPath } from './round-path/scenario';
import { validateScenario as gate } from './gate/scenario';
import { validateScenario as assayer } from './assayer/scenario';
import { validateScenario as blueprint } from './blueprint/scenario';
import { validateScenario as well } from './well/scenario';
import { validateScenario as garden } from './garden/scenario';

/**
 * Build-time validators for every mechanic that consumes `params`, keyed by
 * mechanic id. Pure: no DOM, no Lit, so the content build can run them in Node.
 * The lantern is absent deliberately — it takes no params.
 */
export const SCENARIO_VALIDATORS: Record<string, ScenarioValidator> = {
  'mechanic.rain-gauge': rainGauge,
  'mechanic.aviary': aviary,
  'mechanic.cartwright': cartwright,
  'mechanic.round-path': roundPath,
  'mechanic.gate-of-orders': gate,
  'mechanic.assayers-scale': assayer,
  'mechanic.blueprint': blueprint,
  'mechanic.well-and-pipe': well,
  'mechanic.commons-garden': garden,
};