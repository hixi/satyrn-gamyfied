import { describe, expect, test } from 'vitest';
import { starsForMistakes } from '../../src/game/worlds/logic-contract';
import { SCENARIO_VALIDATORS } from '../../src/game/worlds/scenarios';
import { validateScenarios } from '../../tools/content/scenarios';
import { getContent } from '../../src/content';

describe('stars', () => {
  test('mistakes map to 3/2/1 stars at the thresholds', () => {
    const bands = { three: 0, two: 2 };
    expect(starsForMistakes(0, bands)).toBe(3);
    expect(starsForMistakes(2, bands)).toBe(2);
    expect(starsForMistakes(5, bands)).toBe(1);
  });

  test('real content has valid star thresholds', () => {
    expect(validateScenarios(getContent())).toEqual([]);
  });

  test('inverted thresholds are reported', () => {
    const content = getContent();
    const broken = {
      ...content,
      mechanics: {
        ...content.mechanics,
        'mechanic.rain-gauge': {
          ...content.mechanics['mechanic.rain-gauge'],
          params: { ...content.mechanics['mechanic.rain-gauge'].params, stars: { three: 2, two: 0 } },
        },
      },
    };
    expect(validateScenarios(broken).map((p) => p.mechanic)).toContain('mechanic.rain-gauge');
  });

  test('a scored mechanic without stars is reported', () => {
    const content = getContent();
    const params = { ...content.mechanics['mechanic.aviary'].params } as Record<string, unknown>;
    delete params.stars;
    const broken = {
      ...content,
      mechanics: {
        ...content.mechanics,
        'mechanic.aviary': { ...content.mechanics['mechanic.aviary'], params },
      },
    };
    expect(validateScenarios(broken).map((p) => p.mechanic)).toContain('mechanic.aviary');
  });

  test('the garden epilogue must not carry stars', () => {
    const content = getContent();
    const broken = {
      ...content,
      mechanics: {
        ...content.mechanics,
        'mechanic.commons-garden': {
          ...content.mechanics['mechanic.commons-garden'],
          params: { ...content.mechanics['mechanic.commons-garden'].params, stars: { three: 0, two: 0 } },
        },
      },
    };
    expect(validateScenarios(broken).map((p) => p.mechanic)).toContain('mechanic.commons-garden');
  });
});
